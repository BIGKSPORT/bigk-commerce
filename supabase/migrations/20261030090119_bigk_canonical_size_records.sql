-- Preserve existing variant IDs and order lines; consolidate split-size records.
UPDATE bigk.variants SET product_id='P012' WHERE product_id='P013';
UPDATE bigk.products SET active=0,approved=0,tags=(tags::jsonb || '["alias:P012"]'::jsonb)::text,version=version+1 WHERE id='P013' AND NOT(tags::jsonb @> '["alias:P012"]'::jsonb);
UPDATE bigk.variants SET product_id='P019' WHERE product_id='P020';
UPDATE bigk.products SET active=0,approved=0,tags=(tags::jsonb || '["alias:P019"]'::jsonb)::text,version=version+1 WHERE id='P020' AND NOT(tags::jsonb @> '["alias:P019"]'::jsonb);
