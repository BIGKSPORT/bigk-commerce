BEGIN;
SET LOCAL search_path TO bigk_staging,pg_catalog;

CREATE TABLE IF NOT EXISTS channel_stock_policies(variant_id TEXT PRIMARY KEY REFERENCES variants(id),buffer INTEGER NOT NULL DEFAULT 0 CHECK(buffer>=0),version INTEGER NOT NULL DEFAULT 1,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS channel_variant_links(id TEXT PRIMARY KEY,channel TEXT NOT NULL CHECK(channel IN ('bol','ankorstore','faire','amazon')),account_key TEXT NOT NULL,external_id TEXT NOT NULL,variant_id TEXT NOT NULL REFERENCES variants(id),gtin TEXT NOT NULL,external_title TEXT NOT NULL DEFAULT '',paused INTEGER NOT NULL DEFAULT 0 CHECK(paused IN (0,1)),version INTEGER NOT NULL DEFAULT 1,updated_at TEXT NOT NULL,UNIQUE(channel,account_key,external_id),UNIQUE(channel,account_key,variant_id));
CREATE INDEX IF NOT EXISTS channel_links_variant ON channel_variant_links(variant_id);

ALTER TABLE bigk_staging.channel_stock_policies ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON bigk_staging.channel_stock_policies FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON bigk_staging.channel_stock_policies TO bigk_staging_server;
DROP POLICY IF EXISTS channel_server_access ON bigk_staging.channel_stock_policies;
CREATE POLICY channel_server_access ON bigk_staging.channel_stock_policies TO bigk_staging_server USING (true) WITH CHECK (true);
ALTER TABLE bigk_staging.channel_variant_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON bigk_staging.channel_variant_links FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON bigk_staging.channel_variant_links TO bigk_staging_server;
DROP POLICY IF EXISTS channel_server_access ON bigk_staging.channel_variant_links;
CREATE POLICY channel_server_access ON bigk_staging.channel_variant_links TO bigk_staging_server USING (true) WITH CHECK (true);
COMMIT;
