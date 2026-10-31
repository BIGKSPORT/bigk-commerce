import {PGlite} from '@electric-sql/pglite';import {PGLiteSocketServer} from '@electric-sql/pglite-socket';import {readFile,readdir} from 'node:fs/promises';import {spawn} from 'node:child_process';
const db=await PGlite.create();let server;
try{await db.exec('CREATE ROLE anon;CREATE ROLE authenticated;');for(const file of (await readdir('supabase/migrations')).filter(f=>f.endsWith('.sql')).sort())await db.exec(await readFile('supabase/migrations/'+file,'utf8'));
 const {productHistorySchema,adminCredentialSchema}=await import('../lib/backoffice-schema.ts');await db.exec((productHistorySchema+adminCredentialSchema).replace(/\b(product_revisions|admin_credentials|products)\b/g,'bigk.$1'));
 server=new PGLiteSocketServer({db,host:'127.0.0.1',port:0});await server.start();const result=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,['--import','tsx','tests/product-management.test.ts'],{stdio:'inherit',env:{...process.env,NODE_ENV:'test',BIGK_TEST_DATABASE_URL:'postgresql://postgres@'+server.getServerConn()+'/postgres'}});child.on('error',reject);child.on('exit',resolve)});if(result!==0)process.exitCode=1;
}finally{await server?.stop();await db.close()}
