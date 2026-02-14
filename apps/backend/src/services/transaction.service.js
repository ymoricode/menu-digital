import { db, pool } from '../db/index.js';
import { transactions, transactionItems, foods, barcodes } from '../db/schema.js';
import { eq, desc, and, inArray, lt, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import xenditService from './xendit.service.js';

// ============================================================
// Custom Error Classes (typed errors for controller layer)
// ============================================================

export class TableOccupiedError extends Error {
  constructor(tableNumber) {
    super(`Meja ${tableNumber} sedang digunakan. Silakan tunggu sampai pesanan sebelumnya selesai.`);
    this.name = 'TableOccupiedError';
    this.statusCode = 409;
  }
}

export class TransactionNotFoundError extends Error {
  constructor(id) {
    super(`Transaksi dengan ID ${id} tidak ditemukan`);
    this.name = 'TransactionNotFoundError';
    this.statusCode = 404;
  }
}

export class TransactionAlreadyCompletedError extends Error {
  constructor(id) {
    super(`Transaksi ${id} sudah diselesaikan sebelumnya`);
    this.name = 'TransactionAlreadyCompletedError';
    this.statusCode = 409;
  }
}

export class TransactionNotPaidError extends Error {
  constructor(id, currentStatus) {
    super(`Transaksi ${id} belum dibayar (status: ${currentStatus}). Hanya pesanan yang sudah dibayar yang bisa diselesaikan.`);
    this.name = 'TransactionNotPaidError';
    this.statusCode = 422;
  }
}

// ============================================================
// GET ALL TRANSACTIONS
// ============================================================
export const getAll = async () => {
  try {
    const result = await db
      .select({
        id: transactions.id,
        code: transactions.code,
        name: transactions.name,
        phone: transactions.phone,
        externalId: transactions.externalId,
        checkoutLink: transactions.checkoutLink,
        barcodeId: transactions.barcodeId,
        tableNumber: barcodes.tableNumber,
        paymentMethod: transactions.paymentMethod,
        paymentStatus: transactions.paymentStatus,
        total: transactions.total,
        completedAt: transactions.completedAt,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
      })
      .from(transactions)
      .leftJoin(barcodes, eq(transactions.barcodeId, barcodes.id))
      .orderBy(desc(transactions.createdAt));

    return result;
  } catch (error) {
    throw error;
  }
};

// ============================================================
// GET TRANSACTION BY ID (with items)
// ============================================================
export const getById = async (id) => {
  try {
    const [transaction] = await db
      .select({
        id: transactions.id,
        code: transactions.code,
        name: transactions.name,
        phone: transactions.phone,
        externalId: transactions.externalId,
        checkoutLink: transactions.checkoutLink,
        barcodeId: transactions.barcodeId,
        tableNumber: barcodes.tableNumber,
        paymentMethod: transactions.paymentMethod,
        paymentStatus: transactions.paymentStatus,
        total: transactions.total,
        completedAt: transactions.completedAt,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
      })
      .from(transactions)
      .leftJoin(barcodes, eq(transactions.barcodeId, barcodes.id))
      .where(eq(transactions.id, id))
      .limit(1);

    if (!transaction) return null;

    // Get transaction items
    const items = await db
      .select({
        id: transactionItems.id,
        foodsId: transactionItems.foodsId,
        foodName: foods.name,
        foodImage: foods.image,
        quantity: transactionItems.quantity,
        price: transactionItems.price,
        subtotal: transactionItems.subtotal,
      })
      .from(transactionItems)
      .leftJoin(foods, eq(transactionItems.foodsId, foods.id))
      .where(eq(transactionItems.transactionId, id));

    return {
      ...transaction,
      items,
    };
  } catch (error) {
    throw error;
  }
};

// ============================================================
// GET TRANSACTION BY EXTERNAL ID
// ============================================================
export const getByExternalId = async (externalId) => {
  try {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.externalId, externalId))
      .limit(1);

    return transaction;
  } catch (error) {
    throw error;
  }
};

// ============================================================
// CHECK TABLE STATUS
// Returns { isOccupied, activeTransaction? }
// ============================================================
export const checkTableStatus = async (barcodeId) => {
  try {
    const [barcode] = await db
      .select({
        id: barcodes.id,
        tableNumber: barcodes.tableNumber,
        isOccupied: barcodes.isOccupied,
        lockedAt: barcodes.lockedAt,
      })
      .from(barcodes)
      .where(eq(barcodes.id, barcodeId))
      .limit(1);

    if (!barcode) {
      return { exists: false, isOccupied: false };
    }

    let activeTransaction = null;
    if (barcode.isOccupied) {
      // Find the active transaction for this table
      const [activeTx] = await db
        .select({
          id: transactions.id,
          code: transactions.code,
          paymentStatus: transactions.paymentStatus,
          createdAt: transactions.createdAt,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.barcodeId, barcodeId),
            inArray(transactions.paymentStatus, ['pending', 'paid'])
          )
        )
        .orderBy(desc(transactions.createdAt))
        .limit(1);

      activeTransaction = activeTx || null;
    }

    return {
      exists: true,
      isOccupied: barcode.isOccupied,
      lockedAt: barcode.lockedAt,
      tableNumber: barcode.tableNumber,
      activeTransaction,
    };
  } catch (error) {
    throw error;
  }
};

// ============================================================
// CREATE TRANSACTION (with table locking — atomic)
//
// Concurrency strategy:
//   1. BEGIN transaction
//   2. SELECT ... FOR UPDATE on barcodes row (row-level lock)
//   3. If is_occupied = true → ROLLBACK, throw TableOccupiedError
//   4. If is_occupied = false → UPDATE barcodes SET is_occupied = true
//   5. INSERT transaction + items
//   6. COMMIT
//
// The FOR UPDATE clause prevents two concurrent INSERT requests
// from both seeing is_occupied = false — the second request will
// block until the first commits, then see is_occupied = true.
// ============================================================
export const create = async (data) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ── Step 1: Acquire row lock on the barcode (table) ──
    if (data.barcodeId) {
      const lockResult = await client.query(
        'SELECT id, is_occupied, table_number FROM barcodes WHERE id = $1 FOR UPDATE',
        [data.barcodeId]
      );

      if (lockResult.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new Error('Barcode/meja tidak ditemukan');
      }

      const barcode = lockResult.rows[0];

      // ── Step 2: Check if occupied ──
      if (barcode.is_occupied) {
        await client.query('ROLLBACK');
        throw new TableOccupiedError(barcode.table_number);
      }

      // ── Step 3: Lock the table ──
      await client.query(
        'UPDATE barcodes SET is_occupied = true, locked_at = NOW(), updated_at = NOW() WHERE id = $1',
        [data.barcodeId]
      );
    }

    // ── Step 4: Generate transaction code ──
    const transactionCode = `ORD-${Date.now()}-${uuidv4().slice(0, 4).toUpperCase()}`;

    // Calculate total
    let total = 0;
    const itemsWithSubtotal = data.items.map((item) => {
      const subtotal = item.price * item.quantity;
      total += subtotal;
      return { ...item, subtotal };
    });

    // ── Step 5: Create Xendit invoice ──
    const xenditResult = await xenditService.createInvoice({
      code: transactionCode,
      name: data.name,
      phone: data.phone,
      email: data.email,
      total,
      items: itemsWithSubtotal.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
    });

    // ── Step 6: Insert transaction row ──
    const insertTxResult = await client.query(
      `INSERT INTO transactions 
        (code, name, phone, external_id, checkout_link, barcode_id, payment_method, payment_status, total, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING *`,
      [
        transactionCode,
        data.name,
        data.phone,
        xenditResult.externalId,
        xenditResult.invoiceUrl,
        data.barcodeId || null,
        'xendit',
        'pending',
        total,
      ]
    );

    const newTransaction = insertTxResult.rows[0];

    // ── Step 7: Insert transaction items ──
    for (const item of itemsWithSubtotal) {
      await client.query(
        `INSERT INTO transaction_items
          (transaction_id, foods_id, quantity, price, subtotal, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [newTransaction.id, item.foodsId, item.quantity, item.price, item.subtotal]
      );
    }

    // ── Step 8: COMMIT — all or nothing ──
    await client.query('COMMIT');

    return {
      ...newTransaction,
      externalId: xenditResult.externalId,
      checkoutLink: xenditResult.invoiceUrl,
      items: itemsWithSubtotal,
    };
  } catch (error) {
    // Rollback on any error (including Xendit failures)
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error('Rollback error:', rollbackErr);
    }
    throw error;
  } finally {
    client.release();
  }
};

// ============================================================
// COMPLETE TRANSACTION (order delivered — atomic + idempotent)
//
// Concurrency strategy:
//   1. BEGIN transaction
//   2. SELECT ... FOR UPDATE on the transaction row
//   3. If already completed → return success (idempotent)
//   4. If not paid → throw error
//   5. UPDATE transaction: payment_status = 'completed', completed_at = NOW()
//   6. UPDATE barcodes: is_occupied = false, locked_at = NULL
//   7. COMMIT
// ============================================================
export const complete = async (transactionId) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ── Step 1: Lock the transaction row ──
    const txResult = await client.query(
      'SELECT id, payment_status, completed_at, barcode_id FROM transactions WHERE id = $1 FOR UPDATE',
      [transactionId]
    );

    if (txResult.rows.length === 0) {
      await client.query('ROLLBACK');
      throw new TransactionNotFoundError(transactionId);
    }

    const tx = txResult.rows[0];

    // ── Step 2: Idempotency — already completed ──
    if (tx.completed_at !== null || tx.payment_status === 'completed') {
      await client.query('ROLLBACK');
      // Return success for idempotency (double-click safe)
      return {
        id: tx.id,
        alreadyCompleted: true,
        completedAt: tx.completed_at,
      };
    }

    // ── Step 3: Validate — must be paid ──
    if (tx.payment_status !== 'paid') {
      await client.query('ROLLBACK');
      throw new TransactionNotPaidError(transactionId, tx.payment_status);
    }

    // ── Step 4: Mark as completed ──
    const updateResult = await client.query(
      `UPDATE transactions 
       SET payment_status = 'completed', completed_at = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [transactionId]
    );

    // ── Step 5: Release the table ──
    if (tx.barcode_id) {
      await client.query(
        'UPDATE barcodes SET is_occupied = false, locked_at = NULL, updated_at = NOW() WHERE id = $1',
        [tx.barcode_id]
      );
    }

    // ── Step 6: COMMIT ──
    await client.query('COMMIT');

    return {
      ...updateResult.rows[0],
      alreadyCompleted: false,
    };
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error('Rollback error:', rollbackErr);
    }
    throw error;
  } finally {
    client.release();
  }
};

// ============================================================
// UPDATE PAYMENT STATUS (from Xendit webhook)
// Now also handles table unlocking for expired/failed payments
// ============================================================
export const updatePaymentStatus = async (externalId, status, paymentMethod = null) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Lock the transaction row to prevent concurrent webhook processing
    const txResult = await client.query(
      'SELECT id, payment_status, barcode_id FROM transactions WHERE external_id = $1 FOR UPDATE',
      [externalId]
    );

    if (txResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const tx = txResult.rows[0];

    // Idempotency: if already in target status, skip
    if (tx.payment_status === status) {
      await client.query('ROLLBACK');
      return tx;
    }

    // Prevent updating a completed transaction
    if (tx.payment_status === 'completed') {
      await client.query('ROLLBACK');
      return tx;
    }

    const updateData = {
      paymentStatus: status,
      updatedAt: new Date(),
    };

    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod;
    }

    // Update the transaction status
    let updateQuery = 'UPDATE transactions SET payment_status = $1, updated_at = NOW()';
    const params = [status];

    if (paymentMethod) {
      updateQuery += ', payment_method = $' + (params.length + 1);
      params.push(paymentMethod);
    }

    updateQuery += ' WHERE external_id = $' + (params.length + 1) + ' RETURNING *';
    params.push(externalId);

    const updateResult = await client.query(updateQuery, params);

    // If payment expired or failed → release the table
    if (['expired', 'failed'].includes(status) && tx.barcode_id) {
      await client.query(
        'UPDATE barcodes SET is_occupied = false, locked_at = NULL, updated_at = NOW() WHERE id = $1',
        [tx.barcode_id]
      );
    }

    await client.query('COMMIT');

    return updateResult.rows[0];
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error('Rollback error:', rollbackErr);
    }
    throw error;
  } finally {
    client.release();
  }
};

// ============================================================
// AUTO UNLOCK STALE TABLES (background job)
//
// Unlocks tables that are stuck due to:
//   Case 1: pending payment > 15 minutes old
//   Case 2: expired payment
//   Case 3: cancelled/failed payment
//   Case 4: DB inconsistency (is_occupied but no active transaction)
//
// Designed to be safe for overlapping cron runs:
//   - Uses FOR UPDATE SKIP LOCKED to avoid contention
//   - Each row is processed independently
// ============================================================
export const autoUnlockStaleTables = async () => {
  const client = await pool.connect();
  let unlockedCount = 0;

  try {
    await client.query('BEGIN');

    // Find all occupied barcodes (with SKIP LOCKED to avoid cron overlap)
    const occupiedResult = await client.query(
      'SELECT id, table_number, locked_at FROM barcodes WHERE is_occupied = true FOR UPDATE SKIP LOCKED'
    );

    for (const barcode of occupiedResult.rows) {
      // Find the latest active transaction for this barcode
      const txResult = await client.query(
        `SELECT id, payment_status, created_at 
         FROM transactions 
         WHERE barcode_id = $1 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [barcode.id]
      );

      let shouldUnlock = false;

      if (txResult.rows.length === 0) {
        // Case 4: No transaction found — DB inconsistency
        shouldUnlock = true;
        console.log(`[AutoUnlock] Table ${barcode.table_number}: no transaction found (DB inconsistency)`);
      } else {
        const tx = txResult.rows[0];

        if (tx.payment_status === 'pending') {
          // Case 1: Pending payment older than 15 minutes
          const createdAt = new Date(tx.created_at);
          const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

          if (createdAt < fifteenMinutesAgo) {
            shouldUnlock = true;

            // Also expire the transaction
            await client.query(
              "UPDATE transactions SET payment_status = 'expired', updated_at = NOW() WHERE id = $1",
              [tx.id]
            );

            console.log(`[AutoUnlock] Table ${barcode.table_number}: pending payment timed out (TRX #${tx.id})`);
          }
        } else if (tx.payment_status === 'expired') {
          // Case 2: Payment expired
          shouldUnlock = true;
          console.log(`[AutoUnlock] Table ${barcode.table_number}: payment expired (TRX #${tx.id})`);
        } else if (['failed', 'cancelled'].includes(tx.payment_status)) {
          // Case 3: Payment cancelled/failed
          shouldUnlock = true;
          console.log(`[AutoUnlock] Table ${barcode.table_number}: payment ${tx.payment_status} (TRX #${tx.id})`);
        } else if (tx.payment_status === 'completed') {
          // Edge case: completed but table still locked
          shouldUnlock = true;
          console.log(`[AutoUnlock] Table ${barcode.table_number}: already completed but still locked (TRX #${tx.id})`);
        }
        // If payment_status is 'paid' — table should stay locked until admin completes
      }

      if (shouldUnlock) {
        await client.query(
          'UPDATE barcodes SET is_occupied = false, locked_at = NULL, updated_at = NOW() WHERE id = $1',
          [barcode.id]
        );
        unlockedCount++;
      }
    }

    await client.query('COMMIT');

    if (unlockedCount > 0) {
      console.log(`[AutoUnlock] Released ${unlockedCount} stale table(s)`);
    }

    return { unlockedCount };
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error('Rollback error:', rollbackErr);
    }
    console.error('[AutoUnlock] Error:', error);
    throw error;
  } finally {
    client.release();
  }
};

export default {
  getAll,
  getById,
  getByExternalId,
  checkTableStatus,
  create,
  complete,
  updatePaymentStatus,
  autoUnlockStaleTables,
};
