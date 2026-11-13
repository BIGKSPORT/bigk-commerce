-- Discount codes for B2C promotional coupons (not Club points).
CREATE TABLE IF NOT EXISTS bigk.discount_codes(
  code TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('percent','fixed')),
  value INTEGER NOT NULL CHECK(value>0),
  min_subtotal_cents INTEGER NOT NULL DEFAULT 0 CHECK(min_subtotal_cents>=0),
  max_redemptions INTEGER,
  per_customer_limit INTEGER,
  starts_at TEXT,
  ends_at TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  redemption_count INTEGER NOT NULL DEFAULT 0 CHECK(redemption_count>=0),
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS bigk.discount_redemptions(
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL REFERENCES bigk.discount_codes(code),
  order_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  discount_cents INTEGER NOT NULL CHECK(discount_cents>=0),
  status TEXT NOT NULL CHECK(status IN ('reserved','applied','released')),
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS discount_redemptions_email ON bigk.discount_redemptions(email,code);
