-- Extend pending applications with a partner/community classification.
ALTER TABLE bigk.ambassador_applications
  ADD COLUMN IF NOT EXISTS partner_type TEXT NOT NULL DEFAULT 'ambassador'
    CHECK (partner_type IN ('ambassador','club','coach','creator','team_leader')),
  ADD COLUMN IF NOT EXISTS organization_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS organization_type TEXT NOT NULL DEFAULT '';
