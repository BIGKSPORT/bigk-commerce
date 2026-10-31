import {db,products,closeDatabase} from '../../lib/db';
if(process.env.DATABASE_PROVIDER!=='sqlite'||!process.env.DATABASE_PATH?.includes('bigk-vest-browser-'))throw Error('Disposable local fixture only');
const p=(await products()).find(p=>p.id==='P007')!;
await db().prepare('UPDATE products SET name=?,description=?,active=1,approved=1 WHERE id=?').run('Alpin Gillet','cream-black Gillet',p.id);
await db().prepare('UPDATE variants SET stock=3,reserved=0 WHERE product_id=?').run(p.id);
await closeDatabase();
