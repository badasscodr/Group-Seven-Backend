import pool from '../config/database';

export interface Migration {
  id: string;
  description: string;
  sql: string;
  rollback?: string;
}

const migrations: Migration[] = [
  {
    id: '001_initial_schema',
    description: 'Create initial database schema with all tables',
    sql: `
      -- This migration is handled by schema.sql
      -- Just mark as completed
      SELECT 1 as completed;
    `,
  },
];

export const createMigrationsTable = async (): Promise<void> => {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS migrations (
      id VARCHAR(255) PRIMARY KEY,
      description TEXT NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await pool.query(createTableSql);
};

export const getExecutedMigrations = async (): Promise<string[]> => {
  const result = await pool.query('SELECT id FROM migrations ORDER BY executed_at');
  return result.rows.map(row => row.id);
};

export const executeMigration = async (migration: Migration): Promise<void> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Execute the migration
    await client.query(migration.sql);

    // Record the migration
    await client.query(
      'INSERT INTO migrations (id, description) VALUES ($1, $2)',
      [migration.id, migration.description]
    );

    await client.query('COMMIT');
    console.log(`✅ Migration ${migration.id} executed successfully`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ Migration ${migration.id} failed:`, error);
    throw error;
  } finally {
    client.release();
  }
};

export const runMigrations = async (): Promise<void> => {
  try {
    console.log('🔄 Running database migrations...');

    await createMigrationsTable();
    const executedMigrations = await getExecutedMigrations();

    for (const migration of migrations) {
      if (!executedMigrations.includes(migration.id)) {
        await executeMigration(migration);
      } else {
        console.log(`⏭️  Migration ${migration.id} already executed`);
      }
    }

    console.log('✅ All migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};