import {db,closeDatabase} from '../../lib/db';import {hash} from '../../lib/security';
if(process.env.DATABASE_PROVIDER!=='sqlite'||!process.env.DATABASE_PATH?.includes('bigk-confirm-browser-')||!process.env.FIXTURE_MAGIC_TOKEN)throw Error('Disposable fixture only');
await db().prepare('INSERT INTO login_tokens VALUES(?,?,?)').run(hash(process.env.FIXTURE_MAGIC_TOKEN),'scanner-fixture@example.test',new Date(Date.now()+600000).toISOString());await closeDatabase();
