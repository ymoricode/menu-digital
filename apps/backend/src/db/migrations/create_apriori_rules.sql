-- ============================================================
-- Migration: Create apriori_rules table
-- Description:
--   Stores association rules mined from transaction data
--   using the Apriori algorithm.
--   Additive change only — does not modify existing tables.
-- ============================================================

CREATE TABLE IF NOT EXISTS apriori_rules (
  id SERIAL PRIMARY KEY,
  antecedent_food_id INTEGER NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  consequent_food_id INTEGER NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  support DOUBLE PRECISION NOT NULL,
  confidence DOUBLE PRECISION NOT NULL,
  lift DOUBLE PRECISION NOT NULL,
  transaction_count INTEGER DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  computed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apriori_rules_antecedent ON apriori_rules(antecedent_food_id);

