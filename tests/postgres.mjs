import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const db = await PGlite.create();
let server;
try {
  await db.exec('CREATE ROLE anon; CREATE ROLE authenticated;');
  const migration = await readFile(new URL('../supabase/migrations/202610290001_bigk_private_commerce.sql', import.meta.url), 'utf8');
  await db.exec(migration);
  await db.exec(migration);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM bigk.products')).rows[0].n,27);
  assert.equal((await db.query("SELECT has_schema_privilege('anon','bigk','USAGE') AS allowed")).rows[0].allowed,false);
  assert.equal((await db.query("SELECT has_table_privilege('authenticated','bigk.orders','SELECT') AS allowed")).rows[0].allowed,false);
  await db.exec('SET ROLE anon;');
  await assert.rejects(() => db.query('SELECT * FROM bigk.orders'), /permission denied/);
  await db.exec('RESET ROLE;');
  const tables = (await db.query("SELECT relname,relrowsecurity FROM pg_class JOIN pg_namespace n ON n.oid=relnamespace WHERE n.nspname='bigk' AND relkind='r'")).rows;
  assert.equal(tables.length,11); assert(tables.every(t=>t.relrowsecurity));
  console.log('PASS: migration runs twice; 27 records; all private tables use RLS; anonymous/customer roles cannot read orders.');
  server = new PGLiteSocketServer({db,host:'127.0.0.1',port:0});
  await server.start();
  const port = new URL('postgresql://' + server.getServerConn()).port;
  if(!port) throw new Error('Cannot determine test server port.');
  const result = await new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,['--import','tsx','tests/commerce.test.ts'],{stdio:'inherit',env:{...process.env,NODE_ENV:'test',DATABASE_PROVIDER:'postgres',BIGK_TEST_DATABASE_URL:`postgresql://postgres@127.0.0.1:${port}/postgres`}});
    child.once('error',reject); child.once('exit',resolve);
  });
  assert.equal(result,0,'PostgreSQL commerce suite failed.');
} finally { if(server) await server.stop(); await db.close(); }
