import { initializeDatabase, checkDatabaseConnection } from '../core/database/init';
import dotenv from 'dotenv';

dotenv.config();

const initDb = async () => {
  try {
    console.log('🔄 Starting database initialization...');

    // Check database connection
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      console.error('❌ Database connection failed. Please check your DATABASE_URL');
      process.exit(1);
    }

    // Initialize database schema
    await initializeDatabase();

    console.log('✅ Database initialization completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

initDb();