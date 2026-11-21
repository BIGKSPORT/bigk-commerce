BEGIN;
ALTER TABLE bigk.b2b_orders
  ADD COLUMN IF NOT EXISTS commission_seller_id TEXT,
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_cents BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_bonus_cents BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_paid_at TEXT;
CREATE INDEX IF NOT EXISTS b2b_orders_commission_seller
  ON bigk.b2b_orders(commission_seller_id, status, updated_at);
COMMIT;
