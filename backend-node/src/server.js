import 'dotenv/config'; // 1. Carga las variables del .env inmediatamente
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { pool } from './config/database.js'; // 2. Ahora pool leerá los datos correctamente

// Import routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import diagnosticRoutes from './routes/diagnosticRoutes.js';
import aiRoutes from './routes/iaRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5500',
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/diagnostics', diagnosticRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // ✅ Verificar conexión a BD
    const result = await pool.query('SELECT NOW()');

    res.json({
      status: 'ok',
      message: 'Riwi Learning Platform API is running',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        timestamp: result.rows[0].now,
      },
      endpoints: {
        auth: '/api/auth',
        users: '/api/users',
        diagnostics: '/api/diagnostics',
        ai: '/api/ai',
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Database connection failed',
      database: {
        connected: false,
        error: error.message,
      },
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    availableEndpoints: [
      '/api/health',
      '/api/auth',
      '/api/users',
      '/api/diagnostics',
      '/api/ai',
    ],
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ✅ Función para verificar conexión a BD antes de arrancar
async function startServer() {
  try {
    // Intentar conectar a la base de datos
    console.log('🔄 Connecting to database...');
    const result = await pool.query(
      'SELECT NOW(), current_database(), current_user'
    );

    console.log('='.repeat(50));
    console.log('✅ Database connected successfully!');
    console.log(`   Database: ${result.rows[0].current_database}`);
    console.log(`   User: ${result.rows[0].current_user}`);
    console.log(`   Time: ${result.rows[0].now}`);
    console.log('='.repeat(50));

    // Arrancar el servidor
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API Health: http://localhost:${PORT}/api/health`);
      console.log('='.repeat(50));
      console.log('📡 Available endpoints:');
      console.log('   POST /api/auth/register');
      console.log('   POST /api/auth/login');
      console.log('   POST /api/auth/logout');
      console.log('   GET  /api/users');
      console.log('   GET  /api/diagnostics/:coderId');
      console.log('   POST /api/diagnostics');
      console.log('   POST /api/ai/generate-plan');
      console.log('='.repeat(50));
    });
  } catch (error) {
    console.error('='.repeat(50));
    console.error('❌ Failed to connect to database!');
    console.error('Error:', error.message);
    console.error('='.repeat(50));
    console.error('💡 Please check:');
    console.error('   1. Database credentials in .env file');
    console.error('   2. Network connection to Supabase');
    console.error('   3. Database is running and accessible');
    console.error('='.repeat(50));
    process.exit(1);
  }
}

// Iniciar el servidor
startServer();
