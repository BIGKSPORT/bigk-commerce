-- Additive private newsletter/blog storage. No product, order or inventory changes.
BEGIN;
CREATE SCHEMA IF NOT EXISTS bigk;
CREATE SCHEMA IF NOT EXISTS bigk_staging;
DO $growth$ DECLARE s text; r text; statement text; t text; BEGIN
FOR s,r IN SELECT * FROM (VALUES ('bigk','bigk_production_web'),('bigk_staging','bigk_staging_server')) AS targets(schema_name,role_name) LOOP
FOR statement IN SELECT jsonb_array_elements_text('["CREATE TABLE IF NOT EXISTS __SCHEMA__.newsletter_subscribers(email TEXT PRIMARY KEY,status TEXT NOT NULL CHECK(status IN (''pending'',''subscribed'',''unsubscribed'')),confirm_hash TEXT UNIQUE,confirm_expires TEXT,unsubscribe_hash TEXT UNIQUE,requested_at TEXT NOT NULL,confirmed_at TEXT,unsubscribed_at TEXT,consent_version TEXT NOT NULL,consent_baseline TEXT)", "CREATE TABLE IF NOT EXISTS __SCHEMA__.blog_posts(id TEXT PRIMARY KEY,slug TEXT NOT NULL UNIQUE,title TEXT NOT NULL,excerpt TEXT NOT NULL,cover_image TEXT NOT NULL,cover_alt TEXT NOT NULL,body TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN (''draft'',''published'',''archived'')),version INTEGER NOT NULL DEFAULT 0,published_at TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL)", "CREATE INDEX IF NOT EXISTS blog_posts_public ON __SCHEMA__.blog_posts(status,published_at)"]'::jsonb) LOOP EXECUTE replace(statement,'__SCHEMA__',quote_ident(s)); END LOOP;
FOREACH t IN ARRAY ARRAY['newsletter_subscribers','blog_posts'] LOOP
 EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY',s,t);
 EXECUTE format('REVOKE ALL ON %I.%I FROM PUBLIC,anon,authenticated',s,t);
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN
  EXECUTE format('GRANT SELECT,INSERT,UPDATE ON %I.%I TO %I',s,t,r);
  IF t='newsletter_subscribers' THEN EXECUTE format('GRANT DELETE ON %I.%I TO %I',s,t,r); END IF;
  EXECUTE format('DROP POLICY IF EXISTS growth_server ON %I.%I',s,t);
  EXECUTE format('CREATE POLICY growth_server ON %I.%I TO %I USING(true) WITH CHECK(true)',s,t,r);
 END IF;
END LOOP;
END LOOP; END $growth$;
INSERT INTO bigk.blog_posts(id,slug,title,excerpt,cover_image,cover_alt,body,status,version,published_at,created_at,updated_at) VALUES('3c9e99b0-6371-48c4-b7f8-087ac4e936b4','meet-the-big-k-series','Meet the BIG K series','ALPIN, VELVET, CORE, NANO DOWN and RIBS: a guide to the names you will see across the BIG K collection.','/products/web/alpin-hood-1u129615.webp','A cream-and-teal BIG K layer from the collection','A collection is easier to explore when its names help you find your way. At BIG K, a series connects related products while each style keeps its own identity. A vest and a hooded gillet can belong to the same series without being the same garment.

Here is a first look at the five series in the collection, and how to use them when browsing.

## ALPIN

ALPIN brings together Alpin Fleece, ALPIN VEST, ALPIN HOOD GILLET and other confirmed Alpin styles. Start with the shape you want: sleeves or sleeveless, a stand collar or a hood. Those differences matter when choosing a layer, so each construction has its own product page.

Colours sit within the relevant style. Choosing a different colour changes its photographs and available sizes; it does not turn a hooded gillet into a stand-collar vest.

## VELVET

VELVET is another series to explore by individual style. Some pieces share a family name while differing in construction. Look at the photographs, details and size information on the actual product rather than treating every item with the same series name as interchangeable.

## CORE

The CORE series includes Core.2, Corelosse.2 and Core Pants. Use the series as a starting point, then compare the individual silhouettes and the information supplied for each product. A shared series name does not mean that every style has the same fit or measurements.

## NANO DOWN

NANO DOWN includes a jacket and a gillet. The distinction is straightforward: choose the product with the construction you are looking for, then check its own material and fit details. Product names are kept consistent across the collection so you can recognise the same style when moving between colours.

## RIBS

RIBS brings together the Low, Medium and Long sock styles. Begin with the height you prefer, then choose a colour and the size range shown on that product. Each height is a separate style, with its own article references.

## From a series to your size

When you find a series you like, open the specific product to inspect its photographs, colour options and listed sizes. Read its own fit and care information before choosing. Availability is shown for the product and size; a series name alone is not a promise that every colour is in stock.

That is the idea behind the BIG K collection: recognisable families, with the details kept close to the product. Looking good. Moving fast.','published',1,to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')) ON CONFLICT(id) DO NOTHING;
INSERT INTO bigk.blog_posts(id,slug,title,excerpt,cover_image,cover_alt,body,status,version,published_at,created_at,updated_at) VALUES('982e4ba5-ee9f-4538-8563-5c101ea46edf','read-your-garment-care-label','Start with the care label','A practical starting point for looking after an apparel purchase: check the garment’s own label before washing, drying or ironing.','/products/web/alpin-vest-pro-bigk-alpin-vest00001.webp','Details of a BIG K vest','Care starts with the label attached to the individual garment. Different fabrics, trims and constructions can need different treatment, even when products belong to the same collection.

## Check before you wash

Look for the washing, bleaching, drying and ironing symbols on your garment. Use those instructions as the reference for that item. Do not assume that a method suited to one jacket is also right for another garment or for footwear.

## Keep product details close

Your product page includes a Material & care section. Read it alongside the physical label. If the information is unclear, ask for clarification before washing rather than choosing a hotter cycle or stronger treatment.

## Drying and finishing

Check the drying symbol before using a tumble dryer, and the ironing symbol before applying heat. A crossed-out symbol means that method is not suitable. Let the label guide the choice rather than relying on the appearance of a fabric.

This article is a general reading guide for garment labels. It does not replace the instructions supplied with a particular product.','draft',1,NULL,to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')) ON CONFLICT(id) DO NOTHING;
INSERT INTO bigk.blog_posts(id,slug,title,excerpt,cover_image,cover_alt,body,status,version,published_at,created_at,updated_at) VALUES('1b9acffa-2a82-4bc5-8848-3ba1ea595e62','a-closer-look-at-size-guides','A closer look at size guides','Body measurements and finished-garment measurements describe different things. Check which type of guide your chosen product uses.','/products/web/core-pants-bigk-core-pants00014.webp','BIG K trousers shown in the collection','A useful size choice starts with the guide for the product you actually want. A series name, a familiar letter size or the size of another brand cannot tell the whole story.

## Body or garment measurements?

Some tables describe the wearer’s body measurements. Others describe a finished garment measured flat. Those figures are not interchangeable. Check the heading and notes before comparing them with your own measurements.

## Read the fit information

Look for any product-specific fit description and model information. Use it as context alongside the size guide, rather than treating a model’s height as a size recommendation for everyone.

## Check the exact style

Products in the same series can have different construction or fit. Open the page for the specific jacket, vest, trousers or footwear you are choosing, then check its own listed sizes.

If you are uncertain, ask for product-specific guidance before ordering. This guide does not invent measurements where a verified table has not yet been supplied.','draft',1,NULL,to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')) ON CONFLICT(id) DO NOTHING;
INSERT INTO bigk_staging.blog_posts(id,slug,title,excerpt,cover_image,cover_alt,body,status,version,published_at,created_at,updated_at) VALUES('3c9e99b0-6371-48c4-b7f8-087ac4e936b4','meet-the-big-k-series','Meet the BIG K series','ALPIN, VELVET, CORE, NANO DOWN and RIBS: a guide to the names you will see across the BIG K collection.','/products/web/alpin-hood-1u129615.webp','A cream-and-teal BIG K layer from the collection','A collection is easier to explore when its names help you find your way. At BIG K, a series connects related products while each style keeps its own identity. A vest and a hooded gillet can belong to the same series without being the same garment.

Here is a first look at the five series in the collection, and how to use them when browsing.

## ALPIN

ALPIN brings together Alpin Fleece, ALPIN VEST, ALPIN HOOD GILLET and other confirmed Alpin styles. Start with the shape you want: sleeves or sleeveless, a stand collar or a hood. Those differences matter when choosing a layer, so each construction has its own product page.

Colours sit within the relevant style. Choosing a different colour changes its photographs and available sizes; it does not turn a hooded gillet into a stand-collar vest.

## VELVET

VELVET is another series to explore by individual style. Some pieces share a family name while differing in construction. Look at the photographs, details and size information on the actual product rather than treating every item with the same series name as interchangeable.

## CORE

The CORE series includes Core.2, Corelosse.2 and Core Pants. Use the series as a starting point, then compare the individual silhouettes and the information supplied for each product. A shared series name does not mean that every style has the same fit or measurements.

## NANO DOWN

NANO DOWN includes a jacket and a gillet. The distinction is straightforward: choose the product with the construction you are looking for, then check its own material and fit details. Product names are kept consistent across the collection so you can recognise the same style when moving between colours.

## RIBS

RIBS brings together the Low, Medium and Long sock styles. Begin with the height you prefer, then choose a colour and the size range shown on that product. Each height is a separate style, with its own article references.

## From a series to your size

When you find a series you like, open the specific product to inspect its photographs, colour options and listed sizes. Read its own fit and care information before choosing. Availability is shown for the product and size; a series name alone is not a promise that every colour is in stock.

That is the idea behind the BIG K collection: recognisable families, with the details kept close to the product. Looking good. Moving fast.','published',1,to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')) ON CONFLICT(id) DO NOTHING;
INSERT INTO bigk_staging.blog_posts(id,slug,title,excerpt,cover_image,cover_alt,body,status,version,published_at,created_at,updated_at) VALUES('982e4ba5-ee9f-4538-8563-5c101ea46edf','read-your-garment-care-label','Start with the care label','A practical starting point for looking after an apparel purchase: check the garment’s own label before washing, drying or ironing.','/products/web/alpin-vest-pro-bigk-alpin-vest00001.webp','Details of a BIG K vest','Care starts with the label attached to the individual garment. Different fabrics, trims and constructions can need different treatment, even when products belong to the same collection.

## Check before you wash

Look for the washing, bleaching, drying and ironing symbols on your garment. Use those instructions as the reference for that item. Do not assume that a method suited to one jacket is also right for another garment or for footwear.

## Keep product details close

Your product page includes a Material & care section. Read it alongside the physical label. If the information is unclear, ask for clarification before washing rather than choosing a hotter cycle or stronger treatment.

## Drying and finishing

Check the drying symbol before using a tumble dryer, and the ironing symbol before applying heat. A crossed-out symbol means that method is not suitable. Let the label guide the choice rather than relying on the appearance of a fabric.

This article is a general reading guide for garment labels. It does not replace the instructions supplied with a particular product.','draft',1,NULL,to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')) ON CONFLICT(id) DO NOTHING;
INSERT INTO bigk_staging.blog_posts(id,slug,title,excerpt,cover_image,cover_alt,body,status,version,published_at,created_at,updated_at) VALUES('1b9acffa-2a82-4bc5-8848-3ba1ea595e62','a-closer-look-at-size-guides','A closer look at size guides','Body measurements and finished-garment measurements describe different things. Check which type of guide your chosen product uses.','/products/web/core-pants-bigk-core-pants00014.webp','BIG K trousers shown in the collection','A useful size choice starts with the guide for the product you actually want. A series name, a familiar letter size or the size of another brand cannot tell the whole story.

## Body or garment measurements?

Some tables describe the wearer’s body measurements. Others describe a finished garment measured flat. Those figures are not interchangeable. Check the heading and notes before comparing them with your own measurements.

## Read the fit information

Look for any product-specific fit description and model information. Use it as context alongside the size guide, rather than treating a model’s height as a size recommendation for everyone.

## Check the exact style

Products in the same series can have different construction or fit. Open the page for the specific jacket, vest, trousers or footwear you are choosing, then check its own listed sizes.

If you are uncertain, ask for product-specific guidance before ordering. This guide does not invent measurements where a verified table has not yet been supplied.','draft',1,NULL,to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')) ON CONFLICT(id) DO NOTHING;
COMMIT;
