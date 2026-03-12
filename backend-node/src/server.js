/**
 * app.js — Kairo API Gateway
 *
 * FIXES:
 *  - CORS: added explicit methods and headers so OPTIONS preflight passes
 *  - CORS: unified allowed origins (localhost only, no 127.0.0.1 mix)
 *  - Session cookie: sameSite kept as 'lax' in dev (correct for cross-origin fetches)
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { doubleCsrf } from 'csrf-csrf';
import passport from './config/passport.js';
import { pool, testConnection } from './config/database.js';
import { connectMongo } from './config/mongodb.js';

import authRoutes from './routes/authRoutes.js';
import diagnosticRoutes from './routes/diagnosticRoutes.js';
import coderRoutes from './routes/coderRoutes.js';
import tlRoutes from './routes/tlRoutes.js';
import aiRoutes from './routes/iaRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

/* ════════════════════════════════════════
   CORS
   FIX: unified to localhost only — mixing localhost/127.0.0.1 breaks cookies.
        Added explicit methods + headers so OPTIONS preflight never fails.
════════════════════════════════════════ */
const ALLOWED_ORIGINS = isProduction
  ? [process.env.FRONTEND_URL].filter(Boolean)
  : ['http://localhost:5500', 'http://localhost:5173'];

const _corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie'],
};

app.use(cors(_corsOptions));
app.options('/{*path}', cors(_corsOptions)); // preflight — Express 5 syntax

/* ════════════════════════════════════════
   CSRF ORIGIN GUARD
   Lightweight CSRF mitigation: state-changing requests must originate
   from a trusted origin. JSON Content-Type + SameSite=lax already
   block simple cross-site form attacks; this adds an explicit origin
   check as defense-in-depth.
════════════════════════════════════════ */
app.use((req, res, next) => {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) return next();

  const origin = req.headers.origin || req.headers.referer || '';

  // Allow server-to-server calls (no origin header)
  if (!origin) return next();

  const trusted = ALLOWED_ORIGINS.some(
    (allowed) => origin === allowed || origin.startsWith(allowed + '/')
  );
  if (!trusted) {
    return res.status(403).json({ error: 'CSRF: origin not allowed' });
  }
  next();
});

/* ── Standard middleware ── */
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ════════════════════════════════════════
   SESSION
   sameSite: 'lax'  → correct for dev cross-origin fetches with credentials
   secure: false    → required in dev (http), true in prod (https)
════════════════════════════════════════ */
app.use(
  session({
    name: 'riwi.sid',
    secret: process.env.SESSION_SECRET || 'dev_secret_fallback',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction, // false in dev
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 h
      sameSite: isProduction ? 'none' : 'lax',
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

/* ════════════════════════════════════════
   CSRF PROTECTION  (double-submit cookie pattern via csrf-csrf)
   - GET  /api/csrf-token  → returns a CSRF token the frontend must include
     as X-CSRF-Token header on every state-changing request.
   - Safe methods (GET, HEAD, OPTIONS) are excluded automatically.
   - OAuth callbacks are excluded so the redirect flow is not broken.
════════════════════════════════════════ */
const { generateToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => process.env.SESSION_SECRET || 'dev_csrf_secret_fallback',
  cookieName: isProduction ? '__Host-psifi.x-csrf-token' : 'x-csrf-token',
  cookieOptions: {
    secure: isProduction,
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
});

/* Expose token endpoint — called once on page load */
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: generateToken(req, res) });
});

/* Apply CSRF protection globally — but skip OAuth callbacks */
app.use((req, res, next) => {
  const oauthPaths = ['/api/auth/google/callback', '/api/auth/github/callback'];
  if (oauthPaths.includes(req.path)) return next();
  doubleCsrfProtection(req, res, next);
});

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

/* ════════════════════════════════════════
   ROUTES
════════════════════════════════════════ */
app.use('/api/auth', authRoutes);
app.use('/api/diagnostics', diagnosticRoutes);
app.use('/api/coder', coderRoutes);
app.use('/api/tl', tlRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', assignmentRoutes);

app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'active',
      uptime: process.uptime(),
      database: { connected: true, timestamp: result.rows[0].now },
    });
  } catch (error) {
    res.status(503).json({ status: 'unstable', error: error.message });
  }
});

app.use((req, res) => res.status(404).json({ error: 'Endpoint not found' }));

app.use((err, req, res, next) => {
  const status = err.status || 500;
  console.error(`[System Error] ${err.stack}`);
  res.status(status).json({
    error: true,
    message: isProduction ? 'Internal Server Error' : err.message,
  });
});

/* ════════════════════════════════════════
   BOOTSTRAP
════════════════════════════════════════ */
async function startServer() {
  try {
    process.stdout.write('🔄 Initializing Kairo services... ');
    await testConnection();
    await connectMongo().catch((err) =>
      console.warn('⚠️  MongoDB skipped:', err.message)
    );
    app.listen(PORT, '0.0.0.0', () => {
      console.log('DONE');
      console.log(
        '------------------------------------------------------------'
      );
      console.log('🚀 KAIRO API GATEWAY STARTED SUCCESSFULLY');
      console.log(
        '------------------------------------------------------------'
      );
      console.log(`📡 URL      : http://localhost:${PORT}`);
      console.log(`🌐 Origins  : ${ALLOWED_ORIGINS.join(', ')}`);
      console.log(`🛠️  ENV      : ${process.env.NODE_ENV || 'development'}`);
      console.log(
        '------------------------------------------------------------'
      );
    });
  } catch (error) {
    console.error('FAILED', error);
    process.exit(1);
  }
}

startServer();
