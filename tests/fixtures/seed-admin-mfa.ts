import {db} from '../../lib/db';import {hash} from '../../lib/security';
await db().prepare('INSERT INTO login_tokens VALUES(?,?,?)').run(hash('admin-setup:'+process.env.FIXTURE_SETUP_TOKEN),process.env.ADMIN_OWNER_EMAIL,new Date(Date.now()+600000).toISOString());
