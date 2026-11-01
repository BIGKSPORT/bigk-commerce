import {db,closeDatabase} from '../../lib/db';
if(process.env.DATABASE_PROVIDER!=='sqlite'||!process.env.DATABASE_PATH?.includes('bigk-fleece-save-'))throw Error('Disposable fixture only');
await db().prepare('UPDATE products SET category=?,name=? WHERE id=?').run('Fleece','ALPIN save fixture','P001');await closeDatabase();
