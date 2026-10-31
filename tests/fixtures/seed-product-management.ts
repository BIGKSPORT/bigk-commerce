import {db,products,closeDatabase} from '../../lib/db';
if(process.env.DATABASE_PROVIDER!=='sqlite'||!process.env.DATABASE_PATH?.includes('bigk-product-browser-'))throw Error('Only the disposable browser fixture is permitted.');
const p=(await products()).find(p=>p.id==='P019')!,photo=(await products()).find(p=>p.images.length)!.images[0];
await db().prepare('UPDATE products SET name=?,images=?,price_cents=?,active=0,approved=0 WHERE id=?').run('Nano Down Jacket',JSON.stringify([photo]),14990,p.id);
function gtin(n:number){const s='20000000'+String(n).padStart(4,'0');let sum=0;[...s].reverse().forEach((x,i)=>sum+=Number(x)*(i%2===0?3:1));return s+(10-sum%10)%10}
await db().prepare('INSERT INTO product_content(product_id,content) VALUES(?,?) ON CONFLICT(product_id) DO UPDATE SET content=excluded.content').run(p.id,JSON.stringify({composition:'Test fixture shell: 98% nylon, 2% polyester.',care:'Read label',fit:'Regular',details:'Disposable local fixture',trade:{colour:'Black',originCountry:'CN',identifiers:Object.fromEntries(p.variants.map((v,i)=>[v.id,{sku:'FIXTURE-'+v.size,gtin:gtin(i),verified:true}]))}}));await closeDatabase();
