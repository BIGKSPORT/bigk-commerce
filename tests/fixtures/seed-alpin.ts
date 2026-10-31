import {db,products,closeDatabase} from '../../lib/db';
if(process.env.DATABASE_PROVIDER!=='sqlite'||!process.env.DATABASE_PATH?.includes('bigk-alpin-browser-'))throw Error('Disposable local fixture only');
for(const [id,code,colour,count] of [['P001','25303101','Black',6],['P002','25303102','Emerald Green',10]] as const){const p=(await products()).find(p=>p.id===id)!;await db().prepare('UPDATE products SET name=?,code=?,description=?,images=?,price_cents=?,active=1,approved=1 WHERE id=?').run('Alpin Fleece Pro','Alpin '+code,colour+' FZ stand-collar fleece',JSON.stringify(Array.from({length:count},(_,i)=>'/products/web/alpin-fleece-pro-'+code+'-'+(i+1)+'.webp')),14690,id);await db().prepare('UPDATE variants SET stock=3,reserved=0 WHERE product_id=?').run(id)}
await closeDatabase();
