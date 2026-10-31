import {db,closeDatabase} from '../../lib/db';
if(process.env.DATABASE_PROVIDER!=='sqlite'||!process.env.DATABASE_PATH?.includes('bigk-front-browser-'))throw Error('Disposable fixture only');
await db().prepare("UPDATE products SET active=1,approved=1 WHERE id IN ('P019','P021')").run();await closeDatabase();
