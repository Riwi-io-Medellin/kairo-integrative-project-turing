/**
 * server.js — Kairo API Gateway
 *
 * FIXES:
 *  - CORS: added explicit methods and headers so OPTIONS preflight passes
 *  - CORS: unified allowed origins (localhost only, no 127.0.0.1 mix)
 *  - Session cookie: sameSite kept as 'lax' in dev (correct for cross-origin fetches)
 *  - MongoDB: connectMongo() is called during bootstrap for profile & CV data
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import passport from './config/passport.js';
import { pool, testConnection } from './config/database.js';
import { connectMongo } from './config/mongodb.js';
import { csrfProtection } from './middlewares/csrf.js';

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
app.options('/{*path}', cors(_corsOptions));

/* ── Standard middleware ── */
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ════════════════════════════════════════
   SESSION
════════════════════════════════════════ */
app.use(
  session({
    name: 'riwi.sid',
    secret: process.env.SESSION_SECRET || 'dev_secret_fallback',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 h
      sameSite: isProduction ? 'none' : 'lax',
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

/* ── CSRF Protection ── */
app.use(csrfProtection(ALLOWED_ORIGINS));

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

const healthLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('/api/health', healthLimiter, async (req, res) => {
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

app.use((err, req, res, _next) => {
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

    // PostgreSQL connection check
    await testConnection();

    // MongoDB connection (non-blocking — profile feature degrades gracefully if unavailable)
    connectMongo().catch((err) => {
      console.warn(`⚠️  MongoDB unavailable: ${err.message}. Profile/CV endpoints will fail gracefully.`);
    });

    app.listen(PORT, '0.0.0.0', () => {
      console.log('DONE');
      console.log('------------------------------------------------------------');
      console.log('🚀 KAIRO API GATEWAY STARTED SUCCESSFULLY');
      console.log('------------------------------------------------------------');
      console.log(`📡 URL      : http://localhost:${PORT}`);
      console.log(`🌐 Origins  : ${ALLOWED_ORIGINS.join(', ')}`);
      console.log(`🛠️  ENV      : ${process.env.NODE_ENV || 'development'}`);
      console.log('------------------------------------------------------------');
    });
  } catch (error) {
    console.error('FAILED', error);
    process.exit(1);
  }
}

startServer();
