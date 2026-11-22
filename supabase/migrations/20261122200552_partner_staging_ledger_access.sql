-- Staging-only permission for the disabled partner team-bonus ledger.
-- This file is tracked with migrations for reproducibility, but is a no-op
-- in migration test databases or installations without the isolated schema.
DO $migration$
BEGIN
  IF to_regclass('bigk_staging.ambassador_team_bonus_ledger') IS NOT NULL
     AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname='bigk_staging_server') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE ON bigk_staging.ambassador_team_bonus_ledger TO bigk_staging_server';
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='bigk_staging'
        AND tablename='ambassador_team_bonus_ledger'
        AND policyname='staging_server_access'
    ) THEN
      EXECUTE 'CREATE POLICY staging_server_access ON bigk_staging.ambassador_team_bonus_ledger TO bigk_staging_server USING (true) WITH CHECK (true)';
    END IF;
  END IF;
END
$migration$;
