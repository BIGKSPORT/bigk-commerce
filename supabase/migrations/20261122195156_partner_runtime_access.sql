-- Production runtime access for BIGK partner records.
-- This migration is intentionally pinned to schema bigk and role bigk_production_web.
-- It never falls back to a staging role. Staging access is handled separately.
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
    RAISE EXCEPTION 'Production partner tables are missing from schema bigk; refusing runtime grants.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'bigk_production_web') THEN
    RAISE EXCEPTION 'Required production role bigk_production_web does not exist; refusing fallback to any other role.';
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
    EXECUTE format('REVOKE ALL ON TABLE bigk.%I FROM PUBLIC, anon, authenticated, bigk_staging_server', table_name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE bigk.%I TO bigk_production_web', table_name);
    EXECUTE format('DROP POLICY IF EXISTS partner_server_access ON bigk.%I', table_name);
    EXECUTE format(
      'CREATE POLICY partner_server_access ON bigk.%I TO bigk_production_web USING (true) WITH CHECK (true)',
      table_name
    );
  END LOOP;
END
$migration$;
COMMIT;
