import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Running migration: add_food_availability');

    await client.query('BEGIN');

    // Add is_available column to foods table
    await client.query(`
      ALTER TABLE foods
        ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT TRUE
    `);
    console.log('  ✅ Added foods.is_available (default: TRUE)');

    await client.query('COMMIT');
    console.log('\n🎉 Migration completed successfully!');
    console.log('   All existing products remain available (is_available = TRUE)');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
