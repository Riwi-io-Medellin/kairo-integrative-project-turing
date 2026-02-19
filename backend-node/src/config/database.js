import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, // ✅ SIN fallback hardcodeado
  ssl: {
    rejectUnauthorized: false,
  },
});

// Log de conexión exitosa
pool.on('connect', () => {
  console.log('🔌 New database connection established');
});

// Log de error de conexión
pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err.message);
  // NO hacer process.exit aquí porque puede ser error temporal
});

export const query = (text, params) => pool.query(text, params);
export { pool };
