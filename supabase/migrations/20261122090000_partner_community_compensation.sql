-- BIG K® Partner Community compensation foundation
-- Existing partners retain their current rate; newly approved partners start at 12%.
-- Team-leadership bonuses are recorded as disabled groundwork only. No bonus is accrued or paid by this migration.

ALTER TABLE bigk.ambassadors
  DROP CONSTRAINT IF EXISTS ambassadors_commission_percent_check;
ALTER TABLE bigk.ambassadors
  ADD CONSTRAINT ambassadors_commission_percent_range
  CHECK (commission_percent >= 0 AND commission_percent <= 20);

ALTER TABLE bigk.ambassadors
  ADD COLUMN IF NOT EXISTS partner_type TEXT NOT NULL DEFAULT 'ambassador'
    CHECK (partner_type IN ('ambassador','club','coach','creator','team_leader','regional')),
  ADD COLUMN IF NOT EXISTS partner_level TEXT NOT NULL DEFAULT 'starter'
    CHECK (partner_level IN ('starter','active','top','elite')),
  ADD COLUMN IF NOT EXISTS team_leader_id TEXT REFERENCES bigk.ambassadors(id),
  ADD COLUMN IF NOT EXISTS organization_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS organization_type TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS team_bonus_enabled BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE bigk.ambassadors
  ADD CONSTRAINT ambassadors_not_own_team_leader
  CHECK (team_leader_id IS NULL OR team_leader_id <> id);

CREATE INDEX IF NOT EXISTS ambassadors_team_leader
  ON bigk.ambassadors(team_leader_id) WHERE team_leader_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ambassadors_partner_type_level
  ON bigk.ambassadors(partner_type, partner_level, status);

ALTER TABLE bigk.ambassador_commissions
  DROP CONSTRAINT IF EXISTS ambassador_commissions_commission_percent_check;
ALTER TABLE bigk.ambassador_commissions
  ADD CONSTRAINT ambassador_commissions_commission_percent_range
  CHECK (commission_percent >= 0 AND commission_percent <= 20);

-- Separate, auditable team-bonus ledger. It is deliberately not wired to accrual or payout:
-- enable only after Belgian legal/tax review and an explicit commercial decision.
CREATE TABLE IF NOT EXISTS bigk.ambassador_team_bonus_ledger (
  id TEXT PRIMARY KEY,
  team_leader_id TEXT NOT NULL REFERENCES bigk.ambassadors(id),
  source_ambassador_id TEXT NOT NULL REFERENCES bigk.ambassadors(id),
  order_id TEXT NOT NULL REFERENCES bigk.orders(id),
  eligible_net_cents BIGINT NOT NULL CHECK (eligible_net_cents >= 0),
  bonus_percent NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (bonus_percent >= 0 AND bonus_percent <= 2),
  bonus_cents BIGINT NOT NULL DEFAULT 0 CHECK (bonus_cents >= 0),
  status TEXT NOT NULL DEFAULT 'held' CHECK (status IN ('held','approved','paid','reversed')),
  legal_review_reference TEXT NOT NULL DEFAULT '',
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_leader_id, order_id)
);
CREATE INDEX IF NOT EXISTS ambassador_team_bonus_leader_status
  ON bigk.ambassador_team_bonus_ledger(team_leader_id, status, created_at DESC);

ALTER TABLE bigk.ambassador_team_bonus_ledger ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON bigk.ambassador_team_bonus_ledger FROM PUBLIC, anon, authenticated;
