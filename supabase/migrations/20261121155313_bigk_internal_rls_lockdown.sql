BEGIN;
-- These seven internal tables have no grants to anon/authenticated or application roles.
-- Their owner is postgres (BYPASSRLS); the application runtime role has no table grants.
-- Enabling RLS without policies intentionally makes all non-owner access fail closed.
ALTER TABLE IF EXISTS bigk.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bigk.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bigk.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bigk.runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bigk.artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bigk.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bigk.preview_checks ENABLE ROW LEVEL SECURITY;
COMMIT;
