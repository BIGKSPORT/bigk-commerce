-- Run as the migration owner on staging, after all migrations.
-- This creates a NOLOGIN permission group, not an administrative DB login.
DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='bigk_server') THEN
    CREATE ROLE bigk_server NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
  END IF;
END $$;
GRANT USAGE ON SCHEMA bigk TO bigk_server;
GRANT SELECT,INSERT,UPDATE ON bigk.products,bigk.variants,bigk.orders,bigk.order_lines,bigk.sessions,bigk.rate_limits,bigk.login_tokens,bigk.customer_sessions,bigk.email_outbox,bigk.club_members,bigk.club_orders,bigk.club_events,bigk.club_bookings,bigk.product_content,bigk.withdrawal_requests TO bigk_server;
GRANT SELECT,INSERT ON bigk.audit,bigk.club_ledger,bigk.admin_returns,bigk.media_assets TO bigk_server;
GRANT DELETE ON bigk.sessions,bigk.rate_limits,bigk.login_tokens,bigk.customer_sessions TO bigk_server;
DO $$ DECLARE spec text[]; seq text; BEGIN
 FOREACH spec SLICE 1 IN ARRAY ARRAY[['products','position'],['variants','position'],['order_lines','id'],['audit','id'],['email_outbox','id']] LOOP
  seq:=pg_get_serial_sequence(format('bigk.%I',spec[1]),spec[2]);
  IF seq IS NOT NULL THEN EXECUTE format('GRANT USAGE,SELECT ON SEQUENCE %s TO bigk_server',seq); END IF;
 END LOOP;
END $$;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['products','variants','orders','order_lines','sessions','rate_limits','login_tokens','customer_sessions','email_outbox','club_members','club_orders','club_events','club_bookings','product_content','withdrawal_requests','audit','club_ledger','admin_returns','media_assets'] LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='bigk' AND tablename=t AND policyname='server_access') THEN
   EXECUTE format('CREATE POLICY server_access ON bigk.%I TO bigk_server USING (true) WITH CHECK (true)',t);
  END IF;
 END LOOP;
END $$;
-- webhook_events is insert/select only: repeated provider events are immutable.
GRANT SELECT,INSERT ON bigk.webhook_events TO bigk_server;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='bigk' AND tablename='webhook_events' AND policyname='server_access') THEN
  CREATE POLICY server_access ON bigk.webhook_events TO bigk_server USING (true) WITH CHECK (true);
 END IF;
END $$;
-- Separately create a dedicated LOGIN role in the private Supabase dashboard,
-- with a generated password and membership in bigk_server. Do not use postgres.
-- Configure its transaction-pooler URI only in the hosting secret settings.
