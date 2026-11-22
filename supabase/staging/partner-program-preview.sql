-- PREVIEW/STAGING ONLY. Never run this file against schema bigk or Production.
-- The regular Supabase migrations under supabase/migrations remain the production-schema history.
-- This script creates only additive objects in bigk_staging and grants access only to bigk_staging_server.
BEGIN;

CREATE TABLE IF NOT EXISTS bigk_staging.discount_codes (
  code TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('percent','fixed')),
  value INTEGER NOT NULL CHECK (value > 0),
  min_subtotal_cents BIGINT NOT NULL DEFAULT 0 CHECK (min_subtotal_cents >= 0),
  max_redemptions INTEGER,
  per_customer_limit INTEGER,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  redemption_count INTEGER NOT NULL DEFAULT 0 CHECK (redemption_count >= 0),
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS bigk_staging.discount_redemptions (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL REFERENCES bigk_staging.discount_codes(code),
  order_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  discount_cents BIGINT NOT NULL CHECK (discount_cents >= 0),
  status TEXT NOT NULL CHECK (status IN ('reserved','applied','released')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS discount_redemptions_email
  ON bigk_staging.discount_redemptions(email,code);

CREATE TABLE IF NOT EXISTS bigk_staging.ambassador_applications (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  social_url TEXT NOT NULL DEFAULT '',
  audience_note TEXT NOT NULL DEFAULT '',
  motivation TEXT NOT NULL DEFAULT '',
  partner_type TEXT NOT NULL DEFAULT 'ambassador' CHECK (partner_type IN ('ambassador','club','coach','creator','team_leader')),
  organization_name TEXT NOT NULL DEFAULT '',
  organization_type TEXT NOT NULL DEFAULT '',
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
  ON bigk_staging.ambassador_applications(status,created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS ambassador_applications_one_pending_email
  ON bigk_staging.ambassador_applications(lower(email)) WHERE status='pending';

CREATE TABLE IF NOT EXISTS bigk_staging.ambassadors (
  id TEXT PRIMARY KEY,
  application_id TEXT UNIQUE REFERENCES bigk_staging.ambassador_applications(id),
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  referral_code TEXT NOT NULL UNIQUE,
  discount_code TEXT NOT NULL UNIQUE REFERENCES bigk_staging.discount_codes(code),
  customer_discount_percent SMALLINT NOT NULL DEFAULT 10 CHECK (customer_discount_percent=10),
  commission_percent NUMERIC(5,2) NOT NULL DEFAULT 10.00 CHECK (commission_percent>=0 AND commission_percent<=20),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','terminated')),
  approved_by TEXT NOT NULL,
  approved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  terminated_at TIMESTAMPTZ,
  termination_reason TEXT NOT NULL DEFAULT '',
  partner_type TEXT NOT NULL DEFAULT 'ambassador' CHECK (partner_type IN ('ambassador','club','coach','creator','team_leader','regional')),
  partner_level TEXT NOT NULL DEFAULT 'starter' CHECK (partner_level IN ('legacy','starter','active','top','elite')),
  team_leader_id TEXT REFERENCES bigk_staging.ambassadors(id),
  organization_name TEXT NOT NULL DEFAULT '',
  organization_type TEXT NOT NULL DEFAULT '',
  team_bonus_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (team_leader_id IS NULL OR team_leader_id<>id)
);
CREATE INDEX IF NOT EXISTS ambassadors_status ON bigk_staging.ambassadors(status);
CREATE INDEX IF NOT EXISTS ambassadors_team_leader
  ON bigk_staging.ambassadors(team_leader_id) WHERE team_leader_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ambassadors_partner_type_level
  ON bigk_staging.ambassadors(partner_type,partner_level,status);

CREATE TABLE IF NOT EXISTS bigk_staging.ambassador_attributions (
  id TEXT PRIMARY KEY,
  ambassador_id TEXT NOT NULL REFERENCES bigk_staging.ambassadors(id),
  order_id TEXT NOT NULL UNIQUE REFERENCES bigk_staging.orders(id),
  customer_email_hash TEXT NOT NULL,
  discount_code TEXT NOT NULL,
  product_subtotal_cents BIGINT NOT NULL CHECK (product_subtotal_cents>=0),
  discount_cents BIGINT NOT NULL CHECK (discount_cents>=0),
  attributed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'discount_code' CHECK (source='discount_code')
);
CREATE INDEX IF NOT EXISTS ambassador_attributions_ambassador_date
  ON bigk_staging.ambassador_attributions(ambassador_id,attributed_at DESC);

CREATE TABLE IF NOT EXISTS bigk_staging.ambassador_commissions (
  id TEXT PRIMARY KEY,
  attribution_id TEXT NOT NULL UNIQUE REFERENCES bigk_staging.ambassador_attributions(id),
  ambassador_id TEXT NOT NULL REFERENCES bigk_staging.ambassadors(id),
  order_id TEXT NOT NULL UNIQUE REFERENCES bigk_staging.orders(id),
  eligible_product_net_cents BIGINT NOT NULL DEFAULT 0 CHECK (eligible_product_net_cents>=0),
  commission_percent NUMERIC(5,2) NOT NULL DEFAULT 10.00 CHECK (commission_percent>=0 AND commission_percent<=20),
  commission_cents BIGINT NOT NULL DEFAULT 0 CHECK (commission_cents>=0),
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
  ON bigk_staging.ambassador_commissions(ambassador_id,status,created_at DESC);

CREATE TABLE IF NOT EXISTS bigk_staging.ambassador_payouts (
  id TEXT PRIMARY KEY,
  ambassador_id TEXT NOT NULL REFERENCES bigk_staging.ambassadors(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'EUR' CHECK (currency='EUR'),
  amount_cents BIGINT NOT NULL CHECK (amount_cents>0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','paid','cancelled')),
  reference TEXT NOT NULL DEFAULT '',
  invoice_reference TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  paid_by TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (period_end>=period_start)
);
CREATE INDEX IF NOT EXISTS ambassador_payouts_ambassador_period
  ON bigk_staging.ambassador_payouts(ambassador_id,period_end DESC);

CREATE TABLE IF NOT EXISTS bigk_staging.ambassador_team_bonus_ledger (
  id TEXT PRIMARY KEY,
  team_leader_id TEXT NOT NULL REFERENCES bigk_staging.ambassadors(id),
  source_ambassador_id TEXT NOT NULL REFERENCES bigk_staging.ambassadors(id),
  order_id TEXT NOT NULL REFERENCES bigk_staging.orders(id),
  eligible_net_cents BIGINT NOT NULL CHECK (eligible_net_cents>=0),
  bonus_percent NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (bonus_percent>=0 AND bonus_percent<=2),
  bonus_cents BIGINT NOT NULL DEFAULT 0 CHECK (bonus_cents>=0),
  status TEXT NOT NULL DEFAULT 'held' CHECK (status IN ('held','approved','paid','reversed')),
  legal_review_reference TEXT NOT NULL DEFAULT '',
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_leader_id,order_id)
);
CREATE INDEX IF NOT EXISTS ambassador_team_bonus_leader_status
  ON bigk_staging.ambassador_team_bonus_ledger(team_leader_id,status,created_at DESC);

ALTER TABLE bigk_staging.discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bigk_staging.discount_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bigk_staging.ambassador_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE bigk_staging.ambassadors ENABLE ROW LEVEL SECURITY;
ALTER TABLE bigk_staging.ambassador_attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bigk_staging.ambassador_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bigk_staging.ambassador_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bigk_staging.ambassador_team_bonus_ledger ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON bigk_staging.discount_codes,bigk_staging.discount_redemptions,
  bigk_staging.ambassador_applications,bigk_staging.ambassadors,
  bigk_staging.ambassador_attributions,bigk_staging.ambassador_commissions,
  bigk_staging.ambassador_payouts,bigk_staging.ambassador_team_bonus_ledger
  FROM PUBLIC,anon,authenticated;

GRANT SELECT,INSERT,UPDATE,DELETE ON bigk_staging.discount_codes,bigk_staging.discount_redemptions TO bigk_staging_server;
GRANT SELECT,INSERT,UPDATE ON bigk_staging.ambassador_applications,bigk_staging.ambassadors,
  bigk_staging.ambassador_attributions,bigk_staging.ambassador_commissions,
  bigk_staging.ambassador_payouts TO bigk_staging_server;

DO $policies$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['discount_codes','discount_redemptions','ambassador_applications','ambassadors','ambassador_attributions','ambassador_commissions','ambassador_payouts'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='bigk_staging' AND tablename=t AND policyname='staging_server_access') THEN
      EXECUTE format('CREATE POLICY staging_server_access ON bigk_staging.%I TO bigk_staging_server USING (true) WITH CHECK (true)',t);
    END IF;
  END LOOP;
END
$policies$;

COMMIT;
