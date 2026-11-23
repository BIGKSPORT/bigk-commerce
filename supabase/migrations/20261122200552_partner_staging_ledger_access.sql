-- Staging-only runtime access for the partner team-bonus ledger.
-- Pinned to bigk_staging + bigk_staging_server; never grants production roles.
BEGIN;
DO $migration$
BEGIN
  IF to_regclass('bigk_staging.ambassador_team_bonus_ledger') IS NULL THEN
    RAISE EXCEPTION 'Staging partner ledger is missing from schema bigk_staging; refusing to grant access elsewhere.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'bigk_staging_server') THEN
    RAISE EXCEPTION 'Required staging role bigk_staging_server does not exist; refusing fallback to production role.';
  END IF;

  EXECUTE 'ALTER TABLE bigk_staging.ambassador_team_bonus_ledger ENABLE ROW LEVEL SECURITY';
  EXECUTE 'REVOKE ALL ON TABLE bigk_staging.ambassador_team_bonus_ledger FROM PUBLIC, anon, authenticated, bigk_production_web';
  EXECUTE 'GRANT SELECT, INSERT, UPDATE ON TABLE bigk_staging.ambassador_team_bonus_ledger TO bigk_staging_server';
  EXECUTE 'DROP POLICY IF EXISTS staging_server_access ON bigk_staging.ambassador_team_bonus_ledger';
  EXECUTE 'CREATE POLICY staging_server_access ON bigk_staging.ambassador_team_bonus_ledger TO bigk_staging_server USING (true) WITH CHECK (true)';
END
$migration$;
COMMIT;
