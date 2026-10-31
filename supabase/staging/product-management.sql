-- Development infrastructure only; intentionally does not modify bigk production.
CREATE TABLE IF NOT EXISTS bigk_staging.product_revisions (
 id text PRIMARY KEY,
 product_id text NOT NULL REFERENCES bigk_staging.products(id),
 version integer NOT NULL,
 snapshot text NOT NULL,
 action text NOT NULL,
 actor text NOT NULL,
 created_at text NOT NULL
);
CREATE INDEX IF NOT EXISTS product_revisions_product ON bigk_staging.product_revisions(product_id,created_at);
ALTER TABLE bigk_staging.product_revisions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON bigk_staging.product_revisions FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON bigk_staging.product_revisions TO bigk_staging_server;
DROP POLICY IF EXISTS staging_history_read ON bigk_staging.product_revisions;
CREATE POLICY staging_history_read ON bigk_staging.product_revisions FOR SELECT TO bigk_staging_server USING(true);
DROP POLICY IF EXISTS staging_history_append ON bigk_staging.product_revisions;
CREATE POLICY staging_history_append ON bigk_staging.product_revisions FOR INSERT TO bigk_staging_server WITH CHECK(true);
CREATE TABLE IF NOT EXISTS bigk_staging.admin_credentials(id text PRIMARY KEY,password_hash text NOT NULL,recovery_hash text NOT NULL,updated_at text NOT NULL);
ALTER TABLE bigk_staging.admin_credentials ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON bigk_staging.admin_credentials FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON bigk_staging.admin_credentials TO bigk_staging_server;
DROP POLICY IF EXISTS staging_credentials ON bigk_staging.admin_credentials;
CREATE POLICY staging_credentials ON bigk_staging.admin_credentials TO bigk_staging_server USING(id='admin') WITH CHECK(id='admin');
