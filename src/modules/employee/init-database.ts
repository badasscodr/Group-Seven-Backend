import pool from '../../core/config/database';
import fs from 'fs';
import path from 'path';

export const initializeEmployeeDatabase = async (): Promise<void> => {
  try {
    const sqlFilePath = path.join(__dirname, 'employee.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');

    // Split the script into individual statements
    const statements = sqlScript.split(';').filter(statement => statement.trim().length > 0);

    console.log('🔄 Initializing employee database schema...');

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await pool.query(statement.trim());
        } catch (error: any) {
          // Log but don't fail on expected errors (table already exists, etc.)
          if (!error.message.includes('already exists') && !error.message.includes('duplicate key')) {
            console.warn('SQL Warning:', error.message);
          }
        }
      }
    }

    console.log('✅ Employee database schema initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing employee database:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  initializeEmployeeDatabase()
    .then(() => {
      console.log('Employee database initialization completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Employee database initialization failed:', error);
      process.exit(1);
    });
}