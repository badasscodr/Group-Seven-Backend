import fs from 'fs';
import path from 'path';
import pool from '../config/database';

export const initializeDatabase = async (): Promise<void> => {
  try {
    console.log('🔄 Initializing database schema...');

    // Read the schema SQL file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Execute the schema
    await pool.query(schemaSql);

    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database schema:', error);
    throw error;
  }
};

export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection verified');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};