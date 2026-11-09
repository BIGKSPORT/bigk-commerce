-- Additive category registry. Apply to staging first; no existing category values change.
-- Rollback: turn category_management off, deploy prior app; retain registry/audit data.
DO $migration$
DECLARE target text; permission_role text;
BEGIN
 FOREACH target IN ARRAY ARRAY['bigk','bigk_staging'] LOOP
  IF to_regclass(format('%I.shop_features',target)) IS NULL THEN CONTINUE; END IF;
  permission_role:=CASE WHEN target='bigk' THEN 'bigk_server' ELSE 'bigk_staging_server' END;
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.catalog_categories(name TEXT PRIMARY KEY,labels TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),version INTEGER NOT NULL DEFAULT 0)',target);
  EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS catalog_categories_lower_name ON %I.catalog_categories(LOWER(name))',target);
  EXECUTE format('CREATE INDEX IF NOT EXISTS products_category ON %I.products(category)',target);
  EXECUTE format('ALTER TABLE %I.catalog_categories ENABLE ROW LEVEL SECURITY',target);
  EXECUTE format('REVOKE ALL ON %I.catalog_categories FROM PUBLIC,anon,authenticated',target);
  IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname=target AND tablename='catalog_categories' AND policyname='server_access') THEN
   EXECUTE format('CREATE POLICY server_access ON %I.catalog_categories TO %I USING (true) WITH CHECK (true)',target,permission_role);
  END IF;
  EXECUTE format('GRANT SELECT,INSERT,UPDATE ON %I.catalog_categories TO %I',target,permission_role);
  EXECUTE format('INSERT INTO %I.catalog_categories(name,labels) VALUES(%L,%L) ON CONFLICT(name) DO NOTHING',target,'Jackets & Vests','{"en":"Jackets & Vests","nl":"Jassen & bodywarmers","fr":"Vestes & gilets","de":"Jacken & Westen","it":"Giacche & gilet","es":"Chaquetas & chalecos"}');
  EXECUTE format('INSERT INTO %I.catalog_categories(name,labels) VALUES(%L,%L) ON CONFLICT(name) DO NOTHING',target,'Fleece','{"en":"Fleece","nl":"Fleece","fr":"Polaires","de":"Fleece","it":"Pile","es":"Forros polares"}');
  EXECUTE format('INSERT INTO %I.catalog_categories(name,labels) VALUES(%L,%L) ON CONFLICT(name) DO NOTHING',target,'Pants','{"en":"Pants","nl":"Broeken","fr":"Pantalons","de":"Hosen","it":"Pantaloni","es":"Pantalones"}');
  EXECUTE format('INSERT INTO %I.catalog_categories(name,labels) VALUES(%L,%L) ON CONFLICT(name) DO NOTHING',target,'Accessories','{"en":"Accessories","nl":"Accessoires","fr":"Accessoires","de":"Accessoires","it":"Accessori","es":"Accesorios"}');
  EXECUTE format('INSERT INTO %I.catalog_categories(name,labels) VALUES(%L,%L) ON CONFLICT(name) DO NOTHING',target,'Sneakers','{"en":"Sneakers","nl":"Sneakers","fr":"Baskets","de":"Sneaker","it":"Sneakers","es":"Zapatillas"}');
  EXECUTE format('INSERT INTO %I.catalog_categories(name,labels) VALUES(%L,%L) ON CONFLICT(name) DO NOTHING',target,'Other','{"en":"Other","nl":"Overige","fr":"Autres","de":"Sonstiges","it":"Altro","es":"Otros"}');
  EXECUTE format('INSERT INTO %I.catalog_categories(name,labels) VALUES(%L,%L) ON CONFLICT(name) DO NOTHING',target,'Long sleeves','{"en":"Long-sleeve tops","nl":"Shirts met lange mouwen","fr":"Hauts à manches longues","de":"Langarmshirts","it":"Maglie a maniche lunghe","es":"Camisetas de manga larga"}');
  EXECUTE format('INSERT INTO %I.catalog_categories(name,labels) VALUES(%L,%L) ON CONFLICT(name) DO NOTHING',target,'Thermal','{"en":"Thermal layers","nl":"Thermokleding","fr":"Vêtements thermiques","de":"Thermobekleidung","it":"Abbigliamento termico","es":"Ropa térmica"}');
  -- Existing category keys, including legacy custom values, are preserved.
  EXECUTE format('INSERT INTO %I.catalog_categories(name,labels) SELECT DISTINCT category,json_build_object(''en'',category)::text FROM %I.products WHERE length(trim(category)) BETWEEN 1 AND 80 ON CONFLICT(name) DO NOTHING',target,target);
 END LOOP;
END $migration$;
