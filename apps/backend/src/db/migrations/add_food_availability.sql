-- ============================================================
-- Migration: Add Food Availability Toggle
-- Date: 2026-10-10
-- Description:
--   Add is_available column to foods table for stock toggle.
--   Default is TRUE so all existing products remain available.
--   This is a simple on/off toggle, not numeric stock.
-- ============================================================

ALTER TABLE foods
  ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT TRUE;
