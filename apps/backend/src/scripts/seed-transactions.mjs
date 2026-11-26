/**
 * Seeder: 100 Dummy Transactions for Menu Digital Warung Bakso Putra Solo
 * 
 * Generates 100 realistic transactions for Sep–Nov 2026:
 *   - September 2026: 30 transaksi
 *   - Oktober 2026:   35 transaksi
 *   - November 2026:  35 transaksi
 * 
 * Usage: 
 *   node apps/backend/src/scripts/seed-transactions.mjs
 * 
 * NOTE: Uses Supabase connection pooler. 
 *       If direct connection fails, the script falls back to the live API seeder endpoint.
 */

import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config';

const { Pool } = pg;

// ============================================================
// 1. DATABASE CONNECTION
// ============================================================

// Try direct connection string from env, then try pooler
const DATABASE_URL = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

// ============================================================
// 2. FOOD DATA (from live database — 15 items)
// ============================================================

const FOODS = [
  { id: 4,  name: 'Mie Ayam',              price: 13000, categoryId: 1 },
  { id: 5,  name: 'Juice Jeruk',           price: 8000,  categoryId: 2 },
  { id: 6,  name: 'Juice Alpukat',         price: 12000, categoryId: 2 },
  { id: 7,  name: 'Juice Melon',           price: 8000,  categoryId: 2 },
  { id: 8,  name: 'Juice Mangga',          price: 8000,  categoryId: 2 },
  { id: 9,  name: 'Juice Strawberry',      price: 8000,  categoryId: 2 },
  { id: 10, name: 'Es Buah',               price: 10000, categoryId: 2 },
  { id: 11, name: 'Es Teh Botol',          price: 6000,  categoryId: 2 },
  { id: 12, name: 'Mie Ayam Bakso Iga',    price: 30000, categoryId: 1 },
  { id: 13, name: 'Mie Ayam Bakso',        price: 25000, categoryId: 1 },
  { id: 14, name: 'Bakso Setengah Porsi',  price: 13000, categoryId: 1 },
  { id: 15, name: 'Bakso Isi + Iga',       price: 26000, categoryId: 1 },
  { id: 16, name: 'Mie Ayam Bakso Telur',  price: 25000, categoryId: 1 },
  { id: 17, name: 'Bakso Isi',             price: 21000, categoryId: 1 },
  { id: 18, name: 'Bakso Urat',            price: 21000, categoryId: 1 },
];

const MAKANAN = FOODS.filter(f => f.categoryId === 1); // 8 items
const MINUMAN = FOODS.filter(f => f.categoryId === 2); // 7 items

// ============================================================
// 3. BUYER NAMES (single-word Indonesian names)
// ============================================================

const NAMES = [
  'Dimas', 'Andi', 'Budi', 'Rizky', 'Fajar', 'Putri', 'Siti', 'Rina', 'Dewi', 'Aisyah',
  'Reza', 'Aditya', 'Ilham', 'Nabila', 'Intan', 'Bagas', 'Farhan', 'Citra', 'Wahyu', 'Yoga',
  'Rafi', 'Salsa', 'Nadia', 'Bayu', 'Kevin', 'Tiara', 'Aldi', 'Vina', 'Rangga', 'Maya',
  'Arif', 'Dinda', 'Rian', 'Fitri', 'Nanda', 'Galih', 'Taufik', 'Laila', 'Doni', 'Rara',
];

// ============================================================
// 4. PHONE NUMBER GENERATOR
// ============================================================

function randomPhone() {
  const prefixes = ['0812', '0813', '0821', '0822', '0851', '0852', '0857', '0858', '0877', '0878'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = String(Math.floor(10000000 + Math.random() * 90000000));
  return prefix + suffix;
}

// ============================================================
// 5. DATE GENERATION (WIB timezone = UTC+7)
// ============================================================

function randomDate(year, month, dayMin, dayMax) {
  const day = dayMin + Math.floor(Math.random() * (dayMax - dayMin + 1));
  const hour = 8 + Math.floor(Math.random() * 13); // 08:00–20:59
  const minute = Math.floor(Math.random() * 60);
  const second = Math.floor(Math.random() * 60);
  
  // Create WIB time then convert to UTC for storage
  // WIB is UTC+7, so UTC = WIB - 7 hours
  const wibDate = new Date(year, month - 1, day, hour, minute, second);
  // Store as the WIB time directly (Supabase stores without timezone)
  return wibDate;
}

function generateDatesForMonth(year, month, count) {
  const daysInMonth = new Date(year, month, 0).getDate(); // month is 1-based here
  const dates = [];
  
  // Distribute across the month
  for (let i = 0; i < count; i++) {
    const day = 1 + Math.floor((i / count) * daysInMonth) + Math.floor(Math.random() * 3);
    const clampedDay = Math.min(day, daysInMonth);
    const hour = 8 + Math.floor(Math.random() * 13); // 08:00–20:59
    const minute = Math.floor(Math.random() * 60);
    const second = Math.floor(Math.random() * 60);
    
    const date = new Date(year, month - 1, clampedDay, hour, minute, second);
    dates.push(date);
  }
  
  // Sort chronologically
  dates.sort((a, b) => a - b);
  return dates;
}

// ============================================================
// 6. TRANSACTION GENERATION
// ============================================================

/**
 * Payment status distribution (100 transactions):
 *   - completed: 55 (pesanan berhasil & selesai)
 *   - paid:      15 (sudah bayar, menunggu proses)
 *   - pending:    5 (menunggu pembayaran)
 *   - expired:   15 (pembayaran kedaluwarsa)
 *   - cancelled:  5 (dibatalkan)
 *   - failed:     5 (gagal)
 */

function getStatusDistribution() {
  const statuses = [];
  for (let i = 0; i < 55; i++) statuses.push('completed');
  for (let i = 0; i < 15; i++) statuses.push('paid');
  for (let i = 0; i < 5;  i++) statuses.push('pending');
  for (let i = 0; i < 15; i++) statuses.push('expired');
  for (let i = 0; i < 5;  i++) statuses.push('cancelled');
  for (let i = 0; i < 5;  i++) statuses.push('failed');
  
  // Shuffle
  for (let i = statuses.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [statuses[i], statuses[j]] = [statuses[j], statuses[i]];
  }
  
  return statuses;
}

/**
 * Generate items for a transaction.
 * Each transaction has 1–5 different food items.
 * Most transactions include at least 1 makanan + 1 minuman.
 */
function generateItems() {
  const itemCount = 1 + Math.floor(Math.random() * 5); // 1 to 5
  const selectedFoods = new Set();
  const items = [];
  
  // 80% chance to include at least 1 makanan
  if (Math.random() < 0.8 && itemCount >= 2) {
    const makanan = MAKANAN[Math.floor(Math.random() * MAKANAN.length)];
    selectedFoods.add(makanan.id);
    items.push({
      foodId: makanan.id,
      price: makanan.price,
      quantity: 1 + Math.floor(Math.random() * 3), // 1-3
    });
  }
  
  // 70% chance to include at least 1 minuman
  if (Math.random() < 0.7 && items.length < itemCount) {
    const minuman = MINUMAN[Math.floor(Math.random() * MINUMAN.length)];
    if (!selectedFoods.has(minuman.id)) {
      selectedFoods.add(minuman.id);
      items.push({
        foodId: minuman.id,
        price: minuman.price,
        quantity: 1 + Math.floor(Math.random() * 3), // 1-3
      });
    }
  }
  
  // Fill remaining items
  while (items.length < itemCount) {
    const food = FOODS[Math.floor(Math.random() * FOODS.length)];
    if (!selectedFoods.has(food.id)) {
      selectedFoods.add(food.id);
      items.push({
        foodId: food.id,
        price: food.price,
        quantity: 1 + Math.floor(Math.random() * 3), // 1-3 for extra items
      });
    }
    // If all foods selected, break
    if (selectedFoods.size >= FOODS.length) break;
  }
  
  return items;
}

function generateAllTransactions() {
  const txns = [];
  const statuses = getStatusDistribution();
  
  // Generate dates for each month
  const sepDates = generateDatesForMonth(2026, 9, 30);
  const octDates = generateDatesForMonth(2026, 10, 35);
  const novDates = generateDatesForMonth(2026, 11, 35);
  
  const allDates = [...sepDates, ...octDates, ...novDates];
  
  // Barcode IDs (table numbers) — cycle through 1–6 for variety
  const barcodeIds = [1, 2, 3, 4, 5, 6];
  
  for (let i = 0; i < 100; i++) {
    const name = NAMES[Math.floor(Math.random() * NAMES.length)];
    const phone = randomPhone();
    const date = allDates[i];
    const status = statuses[i];
    const barcodeId = barcodeIds[i % barcodeIds.length];
    
    const items = generateItems();
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    // Generate unique code with SEED prefix to identify dummy data
    const timestamp = date.getTime();
    const suffix = uuidv4().slice(0, 4).toUpperCase();
    const code = `SEED-${timestamp}-${suffix}`;
    
    // External ID matches code format for Midtrans compatibility
    const externalId = code;
    
    // completedAt only for completed status
    let completedAt = null;
    if (status === 'completed') {
      // Completed 10-60 minutes after creation
      const delay = (10 + Math.floor(Math.random() * 50)) * 60 * 1000;
      completedAt = new Date(date.getTime() + delay);
    }
    
    txns.push({
      code,
      name,
      phone,
      externalId,
      checkoutLink: null,
      barcodeId,
      paymentMethod: 'QRIS',
      paymentStatus: status,
      total,
      completedAt,
      createdAt: date,
      updatedAt: status === 'completed' ? completedAt : date,
      items,
    });
  }
  
  return txns;
}

// ============================================================
// 7. DATABASE INSERTION
// ============================================================

async function seedTransactions() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  SEEDER: 100 Dummy Transactions — Menu Digital');
  console.log('  Warung Bakso Putra Solo');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  
  let client;
  try {
    // Test connection
    console.log('[1/5] Connecting to database...');
    client = await pool.connect();
    console.log('      ✅ Connected successfully!');
    
    // Check existing transactions
    console.log('[2/5] Checking existing data...');
    const existingCount = await client.query('SELECT COUNT(*) FROM transactions');
    console.log(`      📊 Existing transactions: ${existingCount.rows[0].count}`);
    
    // Check if seed data already exists
    const seedCount = await client.query(
      "SELECT COUNT(*) FROM transactions WHERE code LIKE 'SEED-%'"
    );
    const existingSeedCount = parseInt(seedCount.rows[0].count, 10);
    
    if (existingSeedCount > 0) {
      console.log(`      ⚠️  Found ${existingSeedCount} existing seed transactions.`);
      console.log('      🧹 Removing old seed data before re-seeding...');
      
      await client.query('BEGIN');
      // Delete seed transaction items first (FK constraint)
      await client.query(
        "DELETE FROM transaction_items WHERE transaction_id IN (SELECT id FROM transactions WHERE code LIKE 'SEED-%')"
      );
      // Delete seed transactions
      await client.query("DELETE FROM transactions WHERE code LIKE 'SEED-%'");
      await client.query('COMMIT');
      
      console.log('      ✅ Old seed data removed.');
    }
    
    // Verify foods exist
    const foodsResult = await client.query('SELECT id, name, price FROM foods ORDER BY id');
    console.log(`      📋 Foods in database: ${foodsResult.rows.length}`);
    if (foodsResult.rows.length === 0) {
      throw new Error('No foods found in database! Cannot seed transactions.');
    }
    
    // Verify barcodes exist
    const barcodesResult = await client.query('SELECT id, table_number FROM barcodes ORDER BY id');
    console.log(`      🪑 Barcodes/tables: ${barcodesResult.rows.length}`);
    
    // Map valid barcode IDs
    const validBarcodeIds = new Set(barcodesResult.rows.map(b => b.id));
    
    // Generate transactions
    console.log('[3/5] Generating 100 transactions...');
    const transactions = generateAllTransactions();
    
    // Validate generated data
    let totalRevenue = 0;
    const statusCounts = {};
    const monthCounts = { 9: 0, 10: 0, 11: 0 };
    
    for (const tx of transactions) {
      const month = tx.createdAt.getMonth() + 1;
      monthCounts[month] = (monthCounts[month] || 0) + 1;
      statusCounts[tx.paymentStatus] = (statusCounts[tx.paymentStatus] || 0) + 1;
      if (['paid', 'completed'].includes(tx.paymentStatus)) {
        totalRevenue += tx.total;
      }
      
      // Fix barcodeId if not valid
      if (!validBarcodeIds.has(tx.barcodeId)) {
        tx.barcodeId = barcodesResult.rows.length > 0 
          ? barcodesResult.rows[0].id 
          : null;
      }
    }
    
    console.log('');
    console.log('      📅 Distribution:');
    console.log(`         Sep 2026: ${monthCounts[9]} transactions`);
    console.log(`         Oct 2026: ${monthCounts[10]} transactions`);
    console.log(`         Nov 2026: ${monthCounts[11]} transactions`);
    console.log('');
    console.log('      📊 Status Distribution:');
    for (const [status, count] of Object.entries(statusCounts)) {
      console.log(`         ${status}: ${count}`);
    }
    console.log('');
    console.log(`      💰 Total Revenue (paid+completed): Rp ${totalRevenue.toLocaleString('id-ID')}`);
    
    // Insert into database
    console.log('');
    console.log('[4/5] Inserting transactions into database...');
    
    await client.query('BEGIN');
    
    let insertedTx = 0;
    let insertedItems = 0;
    
    for (const tx of transactions) {
      // Format dates for PostgreSQL
      const createdAtStr = formatDateForPg(tx.createdAt);
      const updatedAtStr = formatDateForPg(tx.updatedAt || tx.createdAt);
      const completedAtStr = tx.completedAt ? formatDateForPg(tx.completedAt) : null;
      
      // Insert transaction
      const txResult = await client.query(
        `INSERT INTO transactions 
         (code, name, phone, external_id, checkout_link, barcode_id, payment_method, payment_status, total, completed_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING id`,
        [
          tx.code,
          tx.name,
          tx.phone,
          tx.externalId,
          tx.checkoutLink,
          tx.barcodeId,
          tx.paymentMethod,
          tx.paymentStatus,
          tx.total,
          completedAtStr,
          createdAtStr,
          updatedAtStr,
        ]
      );
      
      const transactionId = txResult.rows[0].id;
      
      // Insert transaction items
      for (const item of tx.items) {
        const subtotal = item.price * item.quantity;
        await client.query(
          `INSERT INTO transaction_items
           (transaction_id, foods_id, quantity, price, subtotal, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            transactionId,
            item.foodId,
            item.quantity,
            item.price,
            subtotal,
            createdAtStr,
            updatedAtStr,
          ]
        );
        insertedItems++;
      }
      
      insertedTx++;
      
      // Progress indicator every 25 transactions
      if (insertedTx % 25 === 0) {
        console.log(`      ✅ ${insertedTx}/100 transactions inserted...`);
      }
    }
    
    await client.query('COMMIT');
    
    console.log(`      ✅ ${insertedTx} transactions inserted!`);
    console.log(`      ✅ ${insertedItems} transaction items inserted!`);
    
    // Verification
    console.log('');
    console.log('[5/5] Verifying inserted data...');
    
    const verifyTotal = await client.query('SELECT COUNT(*) FROM transactions');
    const verifySeed = await client.query("SELECT COUNT(*) FROM transactions WHERE code LIKE 'SEED-%'");
    const verifyItems = await client.query(
      "SELECT COUNT(*) FROM transaction_items WHERE transaction_id IN (SELECT id FROM transactions WHERE code LIKE 'SEED-%')"
    );
    
    // Verify by month
    const verifySep = await client.query(
      "SELECT COUNT(*) FROM transactions WHERE code LIKE 'SEED-%' AND EXTRACT(MONTH FROM created_at) = 9 AND EXTRACT(YEAR FROM created_at) = 2026"
    );
    const verifyOct = await client.query(
      "SELECT COUNT(*) FROM transactions WHERE code LIKE 'SEED-%' AND EXTRACT(MONTH FROM created_at) = 10 AND EXTRACT(YEAR FROM created_at) = 2026"
    );
    const verifyNov = await client.query(
      "SELECT COUNT(*) FROM transactions WHERE code LIKE 'SEED-%' AND EXTRACT(MONTH FROM created_at) = 11 AND EXTRACT(YEAR FROM created_at) = 2026"
    );
    
    // Revenue verification
    const verifyRevenue = await client.query(
      "SELECT SUM(total) FROM transactions WHERE code LIKE 'SEED-%' AND payment_status IN ('paid', 'completed')"
    );
    
    // Status verification
    const verifyStatuses = await client.query(
      "SELECT payment_status, COUNT(*) as count FROM transactions WHERE code LIKE 'SEED-%' GROUP BY payment_status ORDER BY count DESC"
    );
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  ✅ VERIFICATION RESULTS');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  Total transactions (all):   ${verifyTotal.rows[0].count}`);
    console.log(`  Seed transactions:          ${verifySeed.rows[0].count}`);
    console.log(`  Seed transaction items:     ${verifyItems.rows[0].count}`);
    console.log('');
    console.log('  📅 By Month:');
    console.log(`     Sep 2026: ${verifySep.rows[0].count} transactions`);
    console.log(`     Oct 2026: ${verifyOct.rows[0].count} transactions`);
    console.log(`     Nov 2026: ${verifyNov.rows[0].count} transactions`);
    console.log('');
    console.log('  📊 By Status:');
    for (const row of verifyStatuses.rows) {
      console.log(`     ${row.payment_status}: ${row.count}`);
    }
    console.log('');
    console.log(`  💰 Revenue (paid+completed): Rp ${parseInt(verifyRevenue.rows[0].sum || 0).toLocaleString('id-ID')}`);
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  🎉 SEEDING COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════');
    
  } catch (error) {
    console.error('');
    console.error('❌ SEEDING FAILED:', error.message);
    
    if (client) {
      try { await client.query('ROLLBACK'); } catch (e) { /* ignore */ }
    }
    
    throw error;
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

// ============================================================
// 8. HELPERS
// ============================================================

function formatDateForPg(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const sec = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}:${sec}`;
}

// ============================================================
// 9. RUN
// ============================================================

seedTransactions().catch((err) => {
  console.error(err);
  process.exit(1);
});
