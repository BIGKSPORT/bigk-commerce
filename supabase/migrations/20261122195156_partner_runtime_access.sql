-- Grant the private application runtime access to partner programme records.
-- Browser roles remain denied; partner data is accessed only through BIGK's server APIs.
BEGIN;
DO $migration$
DECLARE
  runtime_role TEXT;
  table_name TEXT;
BEGIN
  IF to_regclass('bigk.ambassador_applications') IS NULL
     OR to_regclass('bigk.ambassadors') IS NULL
     OR to_regclass('bigk.ambassador_attributions') IS NULL
     OR to_regclass('bigk.ambassador_commissions') IS NULL
     OR to_regclass('bigk.ambassador_payouts') IS NULL THEN
    RAISE EXCEPTION 'Partner programme tables must exist before runtime access is granted.';
  END IF;

  runtime_role := CASE
    WHEN EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'bigk_production_web') THEN 'bigk_production_web'
    WHEN EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'bigk_server') THEN 'bigk_server'
    ELSE NULL
  END;
  IF runtime_role IS NULL THEN
    RAISE EXCEPTION 'No approved BIGK production runtime role exists.';
  END IF;

  FOREACH table_name IN ARRAY ARRAY[
    'ambassador_applications',
    'ambassadors',
    'ambassador_attributions',
    'ambassador_commissions',
    'ambassador_payouts'
  ] LOOP
    EXECUTE format('ALTER TABLE bigk.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON TABLE bigk.%I FROM PUBLIC, anon, authenticated', table_name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE bigk.%I TO %I', table_name, runtime_role);
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'bigk'
        AND tablename = table_name
        AND policyname = 'partner_server_access'
    ) THEN
      EXECUTE format(
        'CREATE POLICY partner_server_access ON bigk.%I TO %I USING (true) WITH CHECK (true)',
        table_name, runtime_role
      );
    END IF;
  END LOOP;
END
$migration$;
COMMIT;
