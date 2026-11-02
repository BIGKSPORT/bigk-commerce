import reviewedMap from '../../docs/catalog-review/product-grouping-map.json';
import {db,products,closeDatabase} from '../../lib/db';
import {groupingPlan} from '../../lib/product-group-migration';
import {importRibsDrafts} from '../../lib/ribs-import';
import {importB10Draft} from '../../lib/b10-import';
if(process.env.DATABASE_PROVIDER!=='sqlite'||!process.env.DATABASE_PATH?.includes('bigk-groups-browser-'))throw Error('Disposable grouping fixture only');
const before=await products(),plan=groupingPlan(before);
for(const p of plan.updated){await db().prepare('UPDATE products SET name=?,description=?,version=version+1 WHERE id=?').run(p.name,p.description,p.id);await db().prepare('INSERT INTO product_content(product_id,content) VALUES(?,?) ON CONFLICT(product_id) DO UPDATE SET content=excluded.content').run(p.id,JSON.stringify(p.content))}
for(const p of plan.added){await db().prepare('INSERT INTO products(id,slug,name,description,code,category,price_cents,approved,active,featured,images,tags,version) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').run(p.id,p.slug,p.name,p.description,p.code,p.category,p.priceCents,0,0,0,'[]','[]',0);await db().prepare('INSERT INTO product_content(product_id,content) VALUES(?,?)').run(p.id,JSON.stringify(p.content))}
for(const p of [...plan.updated,...plan.added])for(const v of p.variants)if(!before.some(old=>old.variants.some(ov=>ov.id===v.id)))await db().prepare('INSERT INTO variants(id,product_id,size,stock,reserved,reported) VALUES(?,?,?,?,?,?)').run(v.id,p.id,v.size,0,0,null);
await importB10Draft();await importRibsDrafts();
// Match the owner-approved catalogue names in screenshots; retain the disposable fixture's IDs and stock.
for(const group of reviewedMap.groups)for(const id of new Set(group.colours.map(colour=>colour.recordId)))await db().prepare('UPDATE products SET name=? WHERE id=?').run(group.name,id);
await closeDatabase();
