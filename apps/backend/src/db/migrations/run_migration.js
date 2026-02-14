import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Running migration: add_table_locking_and_order_completion');

    await client.query('BEGIN');

    // 1. Barcodes: table locking columns
    await client.query(`
      ALTER TABLE barcodes
        ADD COLUMN IF NOT EXISTS is_occupied BOOLEAN NOT NULL DEFAULT FALSE
    `);
    console.log('  ✅ Added barcodes.is_occupied');

    await client.query(`
      ALTER TABLE barcodes
        ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP
    `);
    console.log('  ✅ Added barcodes.locked_at');

    // 2. Transactions: completion timestamp
    await client.query(`
      ALTER TABLE transactions
        ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP
    `);
    console.log('  ✅ Added transactions.completed_at');

    // 3. Index: fast lookup of active transactions per barcode
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_barcode_active
        ON transactions (barcode_id, payment_status)
        WHERE payment_status IN ('pending', 'paid')
    `);
    console.log('  ✅ Created index idx_transactions_barcode_active');

    await client.query('COMMIT');
    console.log('\n🎉 Migration completed successfully!');
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
