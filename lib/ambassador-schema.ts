// SQLite mirror of the reviewed server-side partner programme schema.
// PostgreSQL deployments use the additive Supabase migrations.
export const ambassadorSchema=`
CREATE TABLE IF NOT EXISTS ambassador_applications (
 id TEXT PRIMARY KEY,email TEXT NOT NULL,full_name TEXT NOT NULL,social_url TEXT NOT NULL DEFAULT '',
 audience_note TEXT NOT NULL DEFAULT '',motivation TEXT NOT NULL DEFAULT '',
 privacy_accepted_at TEXT NOT NULL,privacy_notice_version TEXT NOT NULL DEFAULT '2026-11-21',
 terms_accepted_at TEXT NOT NULL,terms_version TEXT NOT NULL DEFAULT '0.1-2026-11-21',
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','withdrawn')),
 reviewed_by TEXT,reviewed_at TEXT,review_note TEXT NOT NULL DEFAULT '',
 created_at TEXT NOT NULL,updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ambassador_applications_status_created ON ambassador_applications(status,created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS ambassador_applications_one_pending_email ON ambassador_applications(lower(email)) WHERE status='pending';
CREATE TABLE IF NOT EXISTS ambassadors (
 id TEXT PRIMARY KEY,application_id TEXT UNIQUE REFERENCES ambassador_applications(id),email TEXT NOT NULL UNIQUE,
 display_name TEXT NOT NULL,referral_code TEXT NOT NULL UNIQUE,discount_code TEXT NOT NULL UNIQUE REFERENCES discount_codes(code),
 customer_discount_percent INTEGER NOT NULL DEFAULT 10 CHECK(customer_discount_percent=10),
 commission_percent REAL NOT NULL DEFAULT 10 CHECK(commission_percent>=0 AND commission_percent<=20),
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','paused','terminated')),
 approved_by TEXT NOT NULL,approved_at TEXT NOT NULL,terminated_at TEXT,termination_reason TEXT NOT NULL DEFAULT '',
 partner_type TEXT NOT NULL DEFAULT 'ambassador' CHECK(partner_type IN ('ambassador','club','coach','creator','team_leader','regional')),
 partner_level TEXT NOT NULL DEFAULT 'starter' CHECK(partner_level IN ('legacy','starter','active','top','elite')),
 team_leader_id TEXT REFERENCES ambassadors(id),organization_name TEXT NOT NULL DEFAULT '',organization_type TEXT NOT NULL DEFAULT '',
 team_bonus_enabled INTEGER NOT NULL DEFAULT 0 CHECK(team_bonus_enabled=0),
 created_at TEXT NOT NULL,CHECK(team_leader_id IS NULL OR team_leader_id<>id)
);
CREATE INDEX IF NOT EXISTS ambassadors_status ON ambassadors(status);
CREATE INDEX IF NOT EXISTS ambassadors_team_leader ON ambassadors(team_leader_id) WHERE team_leader_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ambassadors_partner_type_level ON ambassadors(partner_type,partner_level,status);
CREATE TABLE IF NOT EXISTS ambassador_attributions (
 id TEXT PRIMARY KEY,ambassador_id TEXT NOT NULL REFERENCES ambassadors(id),order_id TEXT NOT NULL UNIQUE REFERENCES orders(id),
 customer_email_hash TEXT NOT NULL,discount_code TEXT NOT NULL,product_subtotal_cents INTEGER NOT NULL CHECK(product_subtotal_cents>=0),
 discount_cents INTEGER NOT NULL CHECK(discount_cents>=0),attributed_at TEXT NOT NULL,source TEXT NOT NULL DEFAULT 'discount_code' CHECK(source='discount_code')
);
CREATE INDEX IF NOT EXISTS ambassador_attributions_ambassador_date ON ambassador_attributions(ambassador_id,attributed_at DESC);
CREATE TABLE IF NOT EXISTS ambassador_commissions (
 id TEXT PRIMARY KEY,attribution_id TEXT NOT NULL UNIQUE REFERENCES ambassador_attributions(id),ambassador_id TEXT NOT NULL REFERENCES ambassadors(id),
 order_id TEXT NOT NULL UNIQUE REFERENCES orders(id),eligible_product_net_cents INTEGER NOT NULL DEFAULT 0 CHECK(eligible_product_net_cents>=0),
 commission_percent REAL NOT NULL DEFAULT 10 CHECK(commission_percent>=0 AND commission_percent<=20),
 commission_cents INTEGER NOT NULL DEFAULT 0 CHECK(commission_cents>=0),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','eligible','approved','paid','reversed','held')),
 hold_reason TEXT NOT NULL DEFAULT 'delivery_and_returns_pending',eligible_at TEXT,approved_by TEXT,approved_at TEXT,payout_id TEXT,paid_at TEXT,
 created_at TEXT NOT NULL,updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ambassador_commissions_ambassador_status ON ambassador_commissions(ambassador_id,status,created_at DESC);
CREATE TABLE IF NOT EXISTS ambassador_payouts (
 id TEXT PRIMARY KEY,ambassador_id TEXT NOT NULL REFERENCES ambassadors(id),period_start TEXT NOT NULL,period_end TEXT NOT NULL,
 currency TEXT NOT NULL DEFAULT 'EUR' CHECK(currency='EUR'),amount_cents INTEGER NOT NULL CHECK(amount_cents>0),
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','approved','paid','cancelled')),
 reference TEXT NOT NULL DEFAULT '',invoice_reference TEXT NOT NULL DEFAULT '',created_by TEXT NOT NULL,
 approved_by TEXT,approved_at TEXT,paid_by TEXT,paid_at TEXT,created_at TEXT NOT NULL,CHECK(period_end>=period_start)
);
CREATE INDEX IF NOT EXISTS ambassador_payouts_ambassador_period ON ambassador_payouts(ambassador_id,period_end DESC);
CREATE TABLE IF NOT EXISTS ambassador_team_bonus_ledger (
 id TEXT PRIMARY KEY,team_leader_id TEXT NOT NULL REFERENCES ambassadors(id),source_ambassador_id TEXT NOT NULL REFERENCES ambassadors(id),
 order_id TEXT NOT NULL REFERENCES orders(id),eligible_net_cents INTEGER NOT NULL CHECK(eligible_net_cents>=0),
 bonus_percent REAL NOT NULL DEFAULT 0 CHECK(bonus_percent>=0 AND bonus_percent<=2),bonus_cents INTEGER NOT NULL DEFAULT 0 CHECK(bonus_cents>=0),
 status TEXT NOT NULL DEFAULT 'held' CHECK(status IN ('held','approved','paid','reversed')),legal_review_reference TEXT NOT NULL DEFAULT '',
 approved_by TEXT,approved_at TEXT,paid_at TEXT,created_at TEXT NOT NULL,UNIQUE(team_leader_id,order_id)
);
CREATE INDEX IF NOT EXISTS ambassador_team_bonus_leader_status ON ambassador_team_bonus_ledger(team_leader_id,status,created_at DESC);
`;
