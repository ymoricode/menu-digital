import { Router } from 'express';
import { pool } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// ============================================================
// TEMPORARY SEEDER ENDPOINT — DELETE AFTER USE
// POST /api/seeder/run  — Insert 100 dummy transactions
// GET  /api/seeder/status — Check seed data status
// DELETE /api/seeder/clean — Remove seed data
// ============================================================

// FOOD DATA (from database — 15 items)
const FOODS = [
  { id: 4,  name: 'Mie Ayam',              price: 13000, cat: 1 },
  { id: 5,  name: 'Juice Jeruk',           price: 8000,  cat: 2 },
  { id: 6,  name: 'Juice Alpukat',         price: 12000, cat: 2 },
  { id: 7,  name: 'Juice Melon',           price: 8000,  cat: 2 },
  { id: 8,  name: 'Juice Mangga',          price: 8000,  cat: 2 },
  { id: 9,  name: 'Juice Strawberry',      price: 8000,  cat: 2 },
  { id: 10, name: 'Es Buah',               price: 10000, cat: 2 },
  { id: 11, name: 'Es Teh Botol',          price: 6000,  cat: 2 },
  { id: 12, name: 'Mie Ayam Bakso Iga',    price: 30000, cat: 1 },
  { id: 13, name: 'Mie Ayam Bakso',        price: 25000, cat: 1 },
  { id: 14, name: 'Bakso Setengah Porsi',  price: 13000, cat: 1 },
  { id: 15, name: 'Bakso Isi + Iga',       price: 26000, cat: 1 },
  { id: 16, name: 'Mie Ayam Bakso Telur',  price: 25000, cat: 1 },
  { id: 17, name: 'Bakso Isi',             price: 21000, cat: 1 },
  { id: 18, name: 'Bakso Urat',            price: 21000, cat: 1 },
];

const MAKANAN = FOODS.filter(f => f.cat === 1);
const MINUMAN = FOODS.filter(f => f.cat === 2);

// Indonesian single-word names
const NAMES = [
  'Dimas', 'Andi', 'Budi', 'Rizky', 'Fajar', 'Putri', 'Siti', 'Rina', 'Dewi', 'Aisyah',
  'Reza', 'Aditya', 'Ilham', 'Nabila', 'Intan', 'Bagas', 'Farhan', 'Citra', 'Wahyu', 'Yoga',
  'Rafi', 'Salsa', 'Nadia', 'Bayu', 'Kevin', 'Tiara', 'Aldi', 'Vina', 'Rangga', 'Maya',
  'Arif', 'Dinda', 'Rian', 'Fitri', 'Nanda', 'Galih', 'Taufik', 'Laila', 'Doni', 'Rara',
];

function randomPhone() {
  const p = ['0812','0813','0821','0822','0851','0852','0857','0858','0877','0878'];
  return p[Math.floor(Math.random() * p.length)] + String(Math.floor(10000000 + Math.random() * 90000000));
}

function fmtDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const sec = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}:${sec}`;
}

function generateDatesForMonth(year, month, count) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const dates = [];
  for (let i = 0; i < count; i++) {
    const baseDay = 1 + Math.floor((i / count) * daysInMonth);
    const jitter = Math.floor(Math.random() * 3);
    const day = Math.min(baseDay + jitter, daysInMonth);
    const hour = 8 + Math.floor(Math.random() * 13);
    const minute = Math.floor(Math.random() * 60);
    const second = Math.floor(Math.random() * 60);
    dates.push(new Date(year, month - 1, day, hour, minute, second));
  }
  dates.sort((a, b) => a - b);
  return dates;
}

function getStatusDistribution() {
  const s = [];
  for (let i = 0; i < 55; i++) s.push('completed');
  for (let i = 0; i < 15; i++) s.push('paid');
  for (let i = 0; i < 5;  i++) s.push('pending');
  for (let i = 0; i < 15; i++) s.push('expired');
  for (let i = 0; i < 5;  i++) s.push('cancelled');
  for (let i = 0; i < 5;  i++) s.push('failed');
  // Shuffle (Fisher-Yates)
  for (let i = s.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [s[i], s[j]] = [s[j], s[i]];
  }
  return s;
}

function generateItems() {
  const count = 1 + Math.floor(Math.random() * 5);
  const used = new Set();
  const items = [];

  // 80% chance include makanan first
  if (Math.random() < 0.8 && count >= 2) {
    const f = MAKANAN[Math.floor(Math.random() * MAKANAN.length)];
    used.add(f.id);
    items.push({ foodId: f.id, price: f.price, quantity: 1 + Math.floor(Math.random() * 3) });
  }
  // 70% chance include minuman
  if (Math.random() < 0.7 && items.length < count) {
    const f = MINUMAN[Math.floor(Math.random() * MINUMAN.length)];
    if (!used.has(f.id)) {
      used.add(f.id);
      items.push({ foodId: f.id, price: f.price, quantity: 1 + Math.floor(Math.random() * 3) });
    }
  }
  // Fill rest
  while (items.length < count) {
    const f = FOODS[Math.floor(Math.random() * FOODS.length)];
    if (!used.has(f.id)) {
      used.add(f.id);
      items.push({ foodId: f.id, price: f.price, quantity: 1 + Math.floor(Math.random() * 3) });
    }
    if (used.size >= FOODS.length) break;
  }
  return items;
}

// ── POST /run — Seed 100 transactions ──
router.post('/run', async (req, res) => {
  const client = await pool.connect();
  try {
    // Check if already seeded
    const seedCheck = await client.query("SELECT COUNT(*) FROM transactions WHERE code LIKE 'SEED-%'");
    const existing = parseInt(seedCheck.rows[0].count, 10);
    
    if (existing > 0) {
      // Clean old seed data first
      await client.query('BEGIN');
      await client.query("DELETE FROM transaction_items WHERE transaction_id IN (SELECT id FROM transactions WHERE code LIKE 'SEED-%')");
      await client.query("DELETE FROM transactions WHERE code LIKE 'SEED-%'");
      await client.query('COMMIT');
    }

    // Get valid barcode IDs
    const barcodes = await client.query('SELECT id FROM barcodes ORDER BY id');
    const barcodeIds = barcodes.rows.length > 0 ? barcodes.rows.map(b => b.id) : [null];

    // Generate data
    const statuses = getStatusDistribution();
    const sepDates = generateDatesForMonth(2026, 9, 30);
    const octDates = generateDatesForMonth(2026, 10, 35);
    const novDates = generateDatesForMonth(2026, 11, 35);
    const allDates = [...sepDates, ...octDates, ...novDates];

    await client.query('BEGIN');

    let txCount = 0;
    let itemCount = 0;
    const summary = { sep: 0, oct: 0, nov: 0, revenue: 0, statusCounts: {} };

    for (let i = 0; i < 100; i++) {
      const name = NAMES[Math.floor(Math.random() * NAMES.length)];
      const phone = randomPhone();
      const date = allDates[i];
      const status = statuses[i];
      const barcodeId = barcodeIds[i % barcodeIds.length];
      const items = generateItems();
      const total = items.reduce((s, it) => s + it.price * it.quantity, 0);
      
      const code = `SEED-${date.getTime()}-${uuidv4().slice(0, 4).toUpperCase()}`;
      
      let completedAt = null;
      if (status === 'completed') {
        const delay = (10 + Math.floor(Math.random() * 50)) * 60 * 1000;
        completedAt = new Date(date.getTime() + delay);
      }

      const createdAtStr = fmtDate(date);
      const updatedAtStr = completedAt ? fmtDate(completedAt) : createdAtStr;
      const completedAtStr = completedAt ? fmtDate(completedAt) : null;

      const txResult = await client.query(
        `INSERT INTO transactions 
         (code, name, phone, external_id, checkout_link, barcode_id, payment_method, payment_status, total, completed_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING id`,
        [code, name, phone, code, null, barcodeId, 'QRIS', status, total, completedAtStr, createdAtStr, updatedAtStr]
      );
      
      const txId = txResult.rows[0].id;

      for (const item of items) {
        const sub = item.price * item.quantity;
        await client.query(
          `INSERT INTO transaction_items (transaction_id, foods_id, quantity, price, subtotal, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [txId, item.foodId, item.quantity, item.price, sub, createdAtStr, updatedAtStr]
        );
        itemCount++;
      }

      txCount++;
      
      // Track summary
      const month = date.getMonth() + 1;
      if (month === 9) summary.sep++;
      if (month === 10) summary.oct++;
      if (month === 11) summary.nov++;
      if (['paid', 'completed'].includes(status)) summary.revenue += total;
      summary.statusCounts[status] = (summary.statusCounts[status] || 0) + 1;
    }

    await client.query('COMMIT');

    // Verification queries
    const verifyTotal = await client.query("SELECT COUNT(*) FROM transactions WHERE code LIKE 'SEED-%'");
    const verifyItems = await client.query(
      "SELECT COUNT(*) FROM transaction_items WHERE transaction_id IN (SELECT id FROM transactions WHERE code LIKE 'SEED-%')"
    );

    res.json({
      success: true,
      message: `Successfully seeded ${txCount} transactions with ${itemCount} items`,
      data: {
        transactionsInserted: txCount,
        itemsInserted: itemCount,
        previousSeedRemoved: existing,
        verified: {
          seedTransactions: parseInt(verifyTotal.rows[0].count, 10),
          seedItems: parseInt(verifyItems.rows[0].count, 10),
        },
        summary: {
          september: summary.sep,
          october: summary.oct,
          november: summary.nov,
          revenue: summary.revenue,
          statusDistribution: summary.statusCounts,
        },
      },
    });
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (e) { /* ignore */ }
    console.error('Seeder error:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
});

// ── GET /status — Check seed data ──
router.get('/status', async (req, res) => {
  try {
    const total = await pool.query('SELECT COUNT(*) FROM transactions');
    const seed = await pool.query("SELECT COUNT(*) FROM transactions WHERE code LIKE 'SEED-%'");
    const original = await pool.query("SELECT COUNT(*) FROM transactions WHERE code NOT LIKE 'SEED-%'");
    
    const byStatus = await pool.query(
      "SELECT payment_status, COUNT(*) as count FROM transactions WHERE code LIKE 'SEED-%' GROUP BY payment_status ORDER BY count DESC"
    );
    
    const byMonth = await pool.query(
      "SELECT EXTRACT(MONTH FROM created_at) as month, COUNT(*) as count FROM transactions WHERE code LIKE 'SEED-%' AND EXTRACT(YEAR FROM created_at) = 2026 GROUP BY month ORDER BY month"
    );
    
    const revenue = await pool.query(
      "SELECT SUM(total) FROM transactions WHERE code LIKE 'SEED-%' AND payment_status IN ('paid', 'completed')"
    );

    res.json({
      success: true,
      data: {
        totalTransactions: parseInt(total.rows[0].count, 10),
        seedTransactions: parseInt(seed.rows[0].count, 10),
        originalTransactions: parseInt(original.rows[0].count, 10),
        seedByMonth: byMonth.rows.map(r => ({ month: parseInt(r.month, 10), count: parseInt(r.count, 10) })),
        seedByStatus: byStatus.rows.map(r => ({ status: r.payment_status, count: parseInt(r.count, 10) })),
        seedRevenue: parseInt(revenue.rows[0].sum || 0, 10),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── DELETE /clean — Remove seed data ──
router.delete('/clean', async (req, res) => {
  const client = await pool.connect();
  try {
    const seedCount = await client.query("SELECT COUNT(*) FROM transactions WHERE code LIKE 'SEED-%'");
    const count = parseInt(seedCount.rows[0].count, 10);
    
    if (count === 0) {
      return res.json({ success: true, message: 'No seed data to remove', removed: 0 });
    }
    
    await client.query('BEGIN');
    await client.query("DELETE FROM transaction_items WHERE transaction_id IN (SELECT id FROM transactions WHERE code LIKE 'SEED-%')");
    await client.query("DELETE FROM transactions WHERE code LIKE 'SEED-%'");
    await client.query('COMMIT');
    
    res.json({ success: true, message: `Removed ${count} seed transactions`, removed: count });
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (e) { /* ignore */ }
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
});

export default router;
