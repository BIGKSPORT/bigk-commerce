-- Additive backoffice foundation. No existing tables or data are removed.
-- Rollback: turn all feature flags off, deploy the previous application version,
-- and retain these tables (invoices/audit are permanent records). Do not reset counters.
DO $migration$
DECLARE target text; permission_role text; tab text;
BEGIN
 FOREACH target IN ARRAY ARRAY['bigk','bigk_staging'] LOOP
  IF to_regclass(format('%I.orders',target)) IS NULL THEN CONTINUE; END IF;
  permission_role:=CASE WHEN target='bigk' THEN 'bigk_server' ELSE 'bigk_staging_server' END;
  IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname=permission_role) THEN
   EXECUTE format('CREATE ROLE %I NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS',permission_role);
  END IF;
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.shop_features(name TEXT PRIMARY KEY,enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)),updated_at TEXT NOT NULL)',target);
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.staff_accounts(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL UNIQUE,role TEXT NOT NULL CHECK(role IN (''stock_manager'',''warehouse_manager'')),active INTEGER NOT NULL DEFAULT 1,password_hash TEXT,secret_encrypted TEXT,last_counter BIGINT NOT NULL DEFAULT -1,invite_hash TEXT UNIQUE,invite_expires TEXT,version INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL)',target);
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.staff_sessions(hash TEXT PRIMARY KEY,staff_id TEXT NOT NULL REFERENCES %I.staff_accounts(id),account_version INTEGER NOT NULL,expires_at TEXT NOT NULL)',target,target);
  EXECUTE format('CREATE INDEX IF NOT EXISTS staff_sessions_staff ON %I.staff_sessions(staff_id)',target);
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.operations_audit(id TEXT PRIMARY KEY,actor_id TEXT NOT NULL,actor_name TEXT NOT NULL,action TEXT NOT NULL,entity TEXT NOT NULL,details TEXT NOT NULL,created_at TEXT NOT NULL)',target);
  EXECUTE format('CREATE INDEX IF NOT EXISTS operations_audit_created ON %I.operations_audit(created_at)',target);
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.customer_messages(id TEXT PRIMARY KEY,customer_id TEXT NOT NULL,email TEXT NOT NULL,subject TEXT NOT NULL,body TEXT NOT NULL,request_hash TEXT NOT NULL,actor_id TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN (''prepared'',''accepted'',''failed'')),created_at TEXT NOT NULL)',target);
  EXECUTE format('CREATE INDEX IF NOT EXISTS customer_messages_customer ON %I.customer_messages(customer_id,created_at)',target);
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.invoice_counters(year INTEGER PRIMARY KEY,last_number INTEGER NOT NULL CHECK(last_number>0))',target);
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.order_invoices(order_id TEXT PRIMARY KEY REFERENCES %I.orders(id),number TEXT NOT NULL UNIQUE,snapshot TEXT NOT NULL,created_at TEXT NOT NULL)',target,target);
  EXECUTE format('CREATE INDEX IF NOT EXISTS orders_created_id ON %I.orders(created_at DESC,id)',target);
  EXECUTE format('CREATE INDEX IF NOT EXISTS audit_entity_action_id ON %I.audit(entity,action,id DESC)',target);
  FOREACH tab IN ARRAY ARRAY['shop_features','staff_accounts','staff_sessions','operations_audit','customer_messages','invoice_counters','order_invoices'] LOOP
   EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY',target,tab);
   EXECUTE format('REVOKE ALL ON %I.%I FROM PUBLIC,anon,authenticated',target,tab);
   IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname=target AND tablename=tab AND policyname='server_access') THEN
    EXECUTE format('CREATE POLICY server_access ON %I.%I TO %I USING (true) WITH CHECK (true)',target,tab,permission_role);
   END IF;
   EXECUTE format('GRANT SELECT,INSERT ON %I.%I TO %I',target,tab,permission_role);
   IF tab NOT IN ('operations_audit','order_invoices') THEN EXECUTE format('GRANT UPDATE ON %I.%I TO %I',target,tab,permission_role); END IF;
  END LOOP;
  EXECUTE format('GRANT DELETE ON %I.staff_sessions TO %I',target,permission_role);
 END LOOP;
END $migration$;
