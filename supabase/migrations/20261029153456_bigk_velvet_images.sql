-- Add only reviewed VELVET images. Preserve approved/live product edits, pricing and inventory.
WITH updated AS (
  UPDATE bigk.products AS p
  SET images=v.images, version=p.version+1
  FROM (VALUES ('P017','["/products/drive/velvet-black-cream-front.png"]'),('P018','["/products/drive/velvet-emerald-cream-front.png"]'),('P026','["/products/drive/velvet-cream-front.jpg","/products/drive/velvet-cream-angle.jpg","/products/drive/velvet-cream-back.jpg","/products/drive/velvet-cream-detail.png"]'),('P027','["/products/drive/velvet-black-front.png","/products/drive/velvet-black-back-model.png","/products/drive/velvet-black-front-flat.jpg","/products/drive/velvet-black-angle.jpg","/products/drive/velvet-black-back-flat.jpg"]')) AS v(id,images)
  WHERE p.id=v.id AND p.approved=0 AND p.active=0
    AND p.images::jsonb IS DISTINCT FROM v.images::jsonb
  RETURNING p.id
), logged AS (
  INSERT INTO bigk.audit(action,entity,created_at)
  SELECT 'catalog.velvet-images-synced',id,to_char(clock_timestamp() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') FROM updated
  RETURNING entity
)
SELECT count(*) AS updated_products FROM logged;
