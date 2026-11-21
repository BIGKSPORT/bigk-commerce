BEGIN;
DO $migration$
DECLARE runtime_role text;
BEGIN
 IF to_regclass('bigk.discount_codes') IS NULL OR to_regclass('bigk.discount_redemptions') IS NULL THEN
  RETURN;
 END IF;
 runtime_role:=CASE WHEN EXISTS(SELECT 1 FROM pg_roles WHERE rolname='bigk_production_web') THEN 'bigk_production_web' ELSE 'bigk_server' END;
 ALTER TABLE bigk.discount_codes ENABLE ROW LEVEL SECURITY;
 ALTER TABLE bigk.discount_redemptions ENABLE ROW LEVEL SECURITY;
 REVOKE ALL ON bigk.discount_codes FROM PUBLIC,anon,authenticated;
 REVOKE ALL ON bigk.discount_redemptions FROM PUBLIC,anon,authenticated;
 EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON bigk.discount_codes TO %I',runtime_role);
 EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON bigk.discount_redemptions TO %I',runtime_role);
 IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='bigk' AND tablename='discount_codes' AND policyname IN ('discount_codes_production_web','discount_codes_server_access')) THEN
  EXECUTE format('CREATE POLICY discount_codes_server_access ON bigk.discount_codes TO %I USING (true) WITH CHECK (true)',runtime_role);
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='bigk' AND tablename='discount_redemptions' AND policyname IN ('discount_redemptions_production_web','discount_redemptions_server_access')) THEN
  EXECUTE format('CREATE POLICY discount_redemptions_server_access ON bigk.discount_redemptions TO %I USING (true) WITH CHECK (true)',runtime_role);
 END IF;
END $migration$;
COMMIT;
