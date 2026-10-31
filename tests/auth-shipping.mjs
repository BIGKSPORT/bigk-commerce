import {PGlite} from '@electric-sql/pglite';
import {PGLiteSocketServer} from '@electric-sql/pglite-socket';
import {readFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
const sql=await PGlite.create();let server;
try{
 await sql.exec('CREATE ROLE anon; CREATE ROLE authenticated;');
 await sql.exec(await readFile('supabase/staging/bigk-staging-bundle.sql','utf8'));
 await sql.exec(await readFile('supabase/staging/admin-shipping.sql','utf8'));
 await sql.exec(await readFile('supabase/staging/product-management.sql','utf8'));
 server=new PGLiteSocketServer({db:sql,host:'127.0.0.1',port:0});await server.start();
 const result=await new Promise((resolve,reject)=>{const p=spawn(process.execPath,['--import','tsx','--test','tests/auth-shipping.test.ts'],{stdio:'inherit',env:{...process.env,NODE_ENV:'test',DATABASE_PROVIDER:'postgres',DATABASE_SCHEMA:'bigk_staging',DATABASE_URL:'postgresql://postgres@'+server.getServerConn()+'/postgres',VERCEL:'1',VERCEL_ENV:'preview',COMMERCE_MODE:'demo'}});p.on('error',reject);p.on('exit',resolve)});
 if(result!==0)process.exitCode=1;
}finally{if(server)await server.stop();await sql.close();}
