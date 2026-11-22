BEGIN;
GRANT SELECT, INSERT, UPDATE ON bigk_staging.ambassador_team_bonus_ledger TO bigk_staging_server;
DO $policies$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='bigk_staging'
      AND tablename='ambassador_team_bonus_ledger'
      AND policyname='staging_server_access'
  ) THEN
    CREATE POLICY staging_server_access
      ON bigk_staging.ambassador_team_bonus_ledger
      TO bigk_staging_server
      USING (true)
      WITH CHECK (true);
  END IF;
END
$policies$;
COMMIT;
