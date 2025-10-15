import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'),
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000'),
  query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'),
  // Add retry settings for Neon
  application_name: 'group-seven-backend',
  // Increase connection timeout for Neon reliability
  connect_timeoutMS: 30000,
};

// Validate required database config
if (!poolConfig.connectionString) {
  console.error('❌ DATABASE_URL is required but not set');
  process.exit(1);
}

let pool: Pool;

export const initDatabase = async (): Promise<void> => {
  try {
    pool = new Pool(poolConfig);
    
    // Test the connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

export const getPool = (): Pool => {
  if (!pool) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return pool;
};

export const getClient = async (): Promise<PoolClient> => {
  return getPool().connect();
};

export const query = async (text: string, params?: any[]): Promise<any> => {
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await getPool().query(text, params);
      return result;
    } catch (error) {
      // Check if it's a network/DNS error that can be retried
      const isRetriableError = error.code === 'EAI_AGAIN' || 
                           error.code === 'ENOTFOUND' || 
                           error.code === 'ETIMEDOUT' ||
                           error.message?.includes('getaddrinfo') ||
                           error.message?.includes('Connection terminated');

      if (isRetriableError && attempt < maxRetries) {
        console.warn(`🔄 Database query retry ${attempt}/${maxRetries} due to network error:`, error.code || error.message);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }

      // For non-retriable errors or last attempt, throw the error
      console.error('❌ Query failed:', error.message);
      throw error;
    }
  }
};

export { pool };

export const transaction = async <T>(callback: (client: PoolClient) => Promise<T>): Promise<T> => {
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      
      // Check if it's a network/DNS error that can be retried
      const isRetriableError = error.code === 'EAI_AGAIN' || 
                           error.code === 'ENOTFOUND' || 
                           error.code === 'ETIMEDOUT' ||
                           error.message?.includes('getaddrinfo') ||
                           error.message?.includes('Connection terminated');

      if (isRetriableError && attempt < maxRetries) {
        console.warn(`🔄 Transaction retry ${attempt}/${maxRetries} due to network error:`, error.code || error.message);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }

      // For non-retriable errors or last attempt, throw the error
      console.error('❌ Transaction failed:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }
};

export const closeDatabase = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    console.log('🔌 Database connection closed');
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDatabase();
  process.exit(0);
});