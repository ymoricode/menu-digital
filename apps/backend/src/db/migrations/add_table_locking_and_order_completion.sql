-- ============================================================
-- Migration: Add Table Locking + Order Completion
-- Date: 2026-02-15
-- Description:
--   1. Add is_occupied & locked_at to barcodes for table locking
--   2. Add completed_at to transactions for order completion
--   3. Add index for fast active-transaction queries
-- ============================================================

-- 1. Barcodes: table locking columns
ALTER TABLE barcodes
  ADD COLUMN IF NOT EXISTS is_occupied BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP;

-- 2. Transactions: completion timestamp
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- 3. Index: fast lookup of active transactions per barcode
CREATE INDEX IF NOT EXISTS idx_transactions_barcode_active
  ON transactions (barcode_id, payment_status)
  WHERE payment_status IN ('pending', 'paid');
