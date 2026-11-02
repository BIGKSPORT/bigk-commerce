-- Additive setup for the password + authenticator feature. No product/order changes.
BEGIN;
DO $mfa$
DECLARE s text; r text;
BEGIN
 FOR s,r IN SELECT * FROM (VALUES ('bigk','bigk_production_web'),('bigk_staging','bigk_staging_server')) AS targets(schema_name,role_name) LOOP
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.admin_mfa(id TEXT PRIMARY KEY CHECK(id=''admin''),secret_encrypted TEXT NOT NULL,last_counter BIGINT NOT NULL,backup_hashes TEXT NOT NULL,updated_at TEXT NOT NULL)',s);
  EXECUTE format('ALTER TABLE %I.admin_mfa ENABLE ROW LEVEL SECURITY',s);
  EXECUTE format('REVOKE ALL ON %I.admin_mfa FROM PUBLIC,anon,authenticated',s);
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN
   EXECUTE format('GRANT SELECT,INSERT,UPDATE ON %I.admin_mfa TO %I',s,r);
   EXECUTE format('DROP POLICY IF EXISTS admin_mfa_server ON %I.admin_mfa',s);
   EXECUTE format('CREATE POLICY admin_mfa_server ON %I.admin_mfa TO %I USING(true) WITH CHECK(true)',s,r);
  END IF;
 END LOOP;
END $mfa$;
COMMIT;
