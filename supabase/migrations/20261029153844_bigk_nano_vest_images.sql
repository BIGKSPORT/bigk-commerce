-- Add only reviewed Nano Down Vest images. Preserve approved/live product edits.
WITH updated AS (
  UPDATE bigk.products
  SET images='["/products/drive/nano-down-vest-1u103249.jpg","/products/drive/nano-down-vest-1u103238.jpg","/products/drive/nano-down-vest-1u103210.jpg","/products/drive/nano-down-vest-1u103248.jpg"]', version=version+1
  WHERE id='P021' AND approved=0 AND active=0 AND images::jsonb IS DISTINCT FROM '["/products/drive/nano-down-vest-1u103249.jpg","/products/drive/nano-down-vest-1u103238.jpg","/products/drive/nano-down-vest-1u103210.jpg","/products/drive/nano-down-vest-1u103248.jpg"]'::jsonb
  RETURNING id
), logged AS (
  INSERT INTO bigk.audit(action,entity,created_at)
  SELECT 'catalog.nano-vest-images-synced',id,to_char(clock_timestamp() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') FROM updated
  RETURNING entity
)
SELECT count(*) AS updated_products FROM logged;
