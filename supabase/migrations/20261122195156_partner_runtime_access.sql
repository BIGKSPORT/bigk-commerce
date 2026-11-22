-- Private server access for the BIGK partner programme.
-- No browser role receives access; all partner records remain behind authenticated server APIs.
BEGIN;
DO $migration$
DECLARE
  table_name TEXT;
BEGIN
  IF to_regclass('bigk.ambassador_applications') IS NULL
     OR to_regclass('bigk.ambassadors') IS NULL
     OR to_regclass('bigk.ambassador_attributions') IS NULL
     OR to_regclass('bigk.ambassador_commissions') IS NULL
     OR to_regclass('bigk.ambassador_payouts') IS NULL
     OR to_regclass('bigk.ambassador_team_bonus_ledger') IS NULL THEN
    RAISE EXCEPTION 'Partner programme tables must exist before runtime access is granted.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'bigk_production_web') THEN
    RAISE EXCEPTION 'Approved BIGK production runtime role bigk_production_web is missing.';
  END IF;

  FOREACH table_name IN ARRAY ARRAY[
    'ambassador_applications',
    'ambassadors',
    'ambassador_attributions',
    'ambassador_commissions',
    'ambassador_payouts',
    'ambassador_team_bonus_ledger'
  ] LOOP
    EXECUTE format('ALTER TABLE bigk.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON TABLE bigk.%I FROM PUBLIC, anon, authenticated', table_name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE bigk.%I TO bigk_production_web', table_name);
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'bigk'
        AND tablename = table_name
        AND policyname = 'partner_server_access'
    ) THEN
      EXECUTE format(
        'CREATE POLICY partner_server_access ON bigk.%I TO bigk_production_web USING (true) WITH CHECK (true)',
        table_name
      );
    END IF;
  END LOOP;
END
$migration$;
COMMIT;
