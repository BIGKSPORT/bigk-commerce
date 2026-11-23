-- BIG K Ambassador Programme
-- Additive schema only. Does not create/activate discount codes or approve applicants.
-- Apply to staging first; production requires the normal BIGK launch review.

CREATE TABLE IF NOT EXISTS bigk.ambassador_applications (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  social_url TEXT NOT NULL DEFAULT '',
  audience_note TEXT NOT NULL DEFAULT '',
  motivation TEXT NOT NULL DEFAULT '',
  privacy_accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  privacy_notice_version TEXT NOT NULL DEFAULT '2026-11-22',
  terms_accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  terms_version TEXT NOT NULL DEFAULT '0.4-2026-11-22',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','withdrawn')),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ambassador_applications_status_created
  ON bigk.ambassador_applications(status, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS ambassador_applications_one_pending_email
  ON bigk.ambassador_applications(lower(email)) WHERE status='pending';

CREATE TABLE IF NOT EXISTS bigk.ambassadors (
  id TEXT PRIMARY KEY,
  application_id TEXT UNIQUE REFERENCES bigk.ambassador_applications(id),
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  referral_code TEXT NOT NULL UNIQUE,
  discount_code TEXT NOT NULL UNIQUE REFERENCES bigk.discount_codes(code),
  customer_discount_percent SMALLINT NOT NULL DEFAULT 10 CHECK (customer_discount_percent = 10),
  commission_percent NUMERIC(5,2) NOT NULL DEFAULT 10.00 CHECK (commission_percent = 10.00),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','terminated')),
  approved_by TEXT NOT NULL,
  approved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  terminated_at TIMESTAMPTZ,
  termination_reason TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ambassadors_status ON bigk.ambassadors(status);

CREATE TABLE IF NOT EXISTS bigk.ambassador_attributions (
  id TEXT PRIMARY KEY,
  ambassador_id TEXT NOT NULL REFERENCES bigk.ambassadors(id),
  order_id TEXT NOT NULL UNIQUE REFERENCES bigk.orders(id),
  customer_email_hash TEXT NOT NULL,
  discount_code TEXT NOT NULL,
  product_subtotal_cents BIGINT NOT NULL CHECK (product_subtotal_cents >= 0),
  discount_cents BIGINT NOT NULL CHECK (discount_cents >= 0),
  attributed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'discount_code' CHECK (source IN ('discount_code'))
);
CREATE INDEX IF NOT EXISTS ambassador_attributions_ambassador_date
  ON bigk.ambassador_attributions(ambassador_id, attributed_at DESC);

CREATE TABLE IF NOT EXISTS bigk.ambassador_commissions (
  id TEXT PRIMARY KEY,
  attribution_id TEXT NOT NULL UNIQUE REFERENCES bigk.ambassador_attributions(id),
  ambassador_id TEXT NOT NULL REFERENCES bigk.ambassadors(id),
  order_id TEXT NOT NULL UNIQUE REFERENCES bigk.orders(id),
  eligible_product_net_cents BIGINT NOT NULL DEFAULT 0 CHECK (eligible_product_net_cents >= 0),
  commission_percent NUMERIC(5,2) NOT NULL DEFAULT 10.00 CHECK (commission_percent = 10.00),
  commission_cents BIGINT NOT NULL DEFAULT 0 CHECK (commission_cents >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','eligible','approved','paid','reversed','held')),
  hold_reason TEXT NOT NULL DEFAULT 'delivery_and_returns_pending',
  eligible_at TIMESTAMPTZ,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  payout_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ambassador_commissions_ambassador_status
  ON bigk.ambassador_commissions(ambassador_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS bigk.ambassador_payouts (
  id TEXT PRIMARY KEY,
  ambassador_id TEXT NOT NULL REFERENCES bigk.ambassadors(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'EUR' CHECK (currency = 'EUR'),
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','paid','cancelled')),
  reference TEXT NOT NULL DEFAULT '',
  invoice_reference TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  paid_by TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (period_end >= period_start)
);
CREATE INDEX IF NOT EXISTS ambassador_payouts_ambassador_period
  ON bigk.ambassador_payouts(ambassador_id, period_end DESC);

ALTER TABLE bigk.ambassador_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE bigk.ambassadors ENABLE ROW LEVEL SECURITY;
ALTER TABLE bigk.ambassador_attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bigk.ambassador_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bigk.ambassador_payouts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON bigk.ambassador_applications, bigk.ambassadors,
  bigk.ambassador_attributions, bigk.ambassador_commissions,
  bigk.ambassador_payouts FROM PUBLIC, anon, authenticated;

-- No client-facing policies: access is server-side only, through the restricted BIGK role.
