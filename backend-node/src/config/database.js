import pkg from 'pg';
import 'dotenv/config';

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  statement_timeout: 30000,
});

pool.on('connect', () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔌 [Database] New client connection established');
  }
});

pool.on('error', (err) => {
  console.error('❌ [Database] Unexpected pool error:', err.message);
});

export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔍 [Query] Executed in ${duration}ms`);
    }
    return res;
  } catch (error) {
    console.error(`❌ [Query Error] ${error.message}`);
    throw error;
  }
};

export async function testConnection() {
  try {
    const result = await pool.query(
      'SELECT NOW(), current_database(), current_user, version()'
    );
    console.log('------------------------------------------------------------');
    console.log('✅ DATABASE HANDSHAKE SUCCESSFUL');
    console.log('------------------------------------------------------------');
    console.log(`   Instance : ${result.rows[0].current_database}`);
    console.log(`   User     : ${result.rows[0].current_user}`);
    console.log(`   Version  : ${result.rows[0].version.split(' ')[0]}`);
    console.log('------------------------------------------------------------');
    return true;
  } catch (error) {
    console.error('\n------------------------------------------------------------');
    console.error('❌ DATABASE CONNECTION FAILED');
    console.error('------------------------------------------------------------');
    console.error(`   Error Code : ${error.code}`);
    console.error(`   Message    : ${error.message}`);
    console.error('------------------------------------------------------------\n');
    throw error;
  }
}

export { pool };
