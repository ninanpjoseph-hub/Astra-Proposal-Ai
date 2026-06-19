import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

/**
 * Returns the MySQL connection pool.
 * Implements lazy-initialization to prevent server crashes if environment variables are not yet configured.
 */
export function getDbPool(): mysql.Pool {
  if (pool) {
    return pool;
  }

  const host = process.env.DB_HOST;
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const database = process.env.DB_NAME || 'astra_proposal_ai';
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const connectionLimit = parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10);

  if (!host || !user) {
    console.warn('⚠️ MySQL database credentials missing in environment variables. Database operations will fail.');
    throw new Error('Database configuration missing. Please satisfy DB_HOST, DB_USER, and DB_PASSWORD variables.');
  }

  try {
    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      ssl: process.env.DB_SSL === 'true' ? {} : undefined // Support secure connections
    });

    console.log(`🔌 MySQL Pool created successfully for database "${database}" on host "${host}"`);
    return pool;
  } catch (error: any) {
    console.error('❌ Failed to initialize MySQL connection pool:', error.message);
    throw error;
  }
}

/**
 * Executes a query securely using preparedness.
 */
export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
  const activePool = getDbPool();
  try {
    const [rows] = await activePool.execute(sql, params);
    return rows as T;
  } catch (error: any) {
    console.error(`❌ Database Query Failure: ${sql}`, error.message);
    throw error;
  }
}

/**
 * Exercises a connection test query (SELECT 1) to verify database configuration.
 */
export async function testConnection(): Promise<{ success: boolean; message: string; host?: string; port?: string; database?: string; user?: string }> {
  try {
    const rows = await query('SELECT 1 as val');
    if (rows && Array.isArray(rows) && rows.length > 0 && rows[0].val === 1) {
      return { 
        success: true, 
        message: 'Successfully established contact with Hostinger MySQL Database!',
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || '3306',
        database: process.env.DB_NAME,
        user: process.env.DB_USER
      };
    }
    return { 
      success: false, 
      message: 'Database connection test returned abnormal payload.',
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || '3306',
      database: process.env.DB_NAME,
      user: process.env.DB_USER
    };
  } catch (error: any) {
    return { 
      success: false, 
      message: `Database offline or unreachable: ${error.message}`,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || '3306',
      database: process.env.DB_NAME,
      user: process.env.DB_USER
    };
  }
}
