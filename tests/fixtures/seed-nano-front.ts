import {db,closeDatabase} from '../../lib/db';
if(process.env.DATABASE_PROVIDER!=='sqlite'||!process.env.DATABASE_PATH?.includes('bigk-front-browser-'))throw Error('Disposable fixture only');
for(const [id,name] of [['P007','Alpin Gillet'],['P019','Nano Down Jacket'],['P021','Nano Down Gillet']])await db().prepare('UPDATE products SET name=?,active=0,approved=0 WHERE id=?').run(name,id);
await db().prepare('UPDATE products SET description=? WHERE id=?').run('cream-black Gillet','P007');
await closeDatabase();
