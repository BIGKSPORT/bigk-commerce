import {db,closeDatabase} from '../../lib/db';
if(process.env.DATABASE_PROVIDER!=='sqlite'||!process.env.DATABASE_PATH?.includes('bigk-alpin-browser-'))throw Error('Disposable local fixture only');
await db().prepare("UPDATE products SET active=0,approved=0 WHERE id IN ('P001','P002')").run();
await closeDatabase();
