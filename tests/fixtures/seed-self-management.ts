import {db,products,closeDatabase} from '../../lib/db';
if(process.env.DATABASE_PROVIDER!=='sqlite'||!process.env.DATABASE_PATH?.includes('bigk-self-management-'))throw Error('Disposable fixture only');
const p=(await products()).find(p=>p.id==='P003')!,photos=['/products/web/core2-1u129550.webp','/products/web/core2-1u129555.webp','/products/web/core2-1u129595.webp'];
await db().prepare('UPDATE products SET name=?,images=?,active=0,approved=0 WHERE id=?').run('Core 2',JSON.stringify(photos),p.id);
await db().prepare('INSERT INTO product_content(product_id,content) VALUES(?,?) ON CONFLICT(product_id) DO UPDATE SET content=excluded.content').run(p.id,JSON.stringify({composition:'Fixture composition',care:'Read the garment care label.',fit:'Fixture fit',details:'Fixture detail',trade:{colour:'Black',identifiers:Object.fromEntries(p.variants.map(v=>[v.id,{sku:'FIXTURE-'+v.size,gtin:'',colour:'Black',images:[photos[0]]}]))}}));await closeDatabase();
