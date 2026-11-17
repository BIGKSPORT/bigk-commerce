import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {b2bPostgresSchema} from '../scripts/b2b-schema';
await test('B2B PostgreSQL provisioning is repeatable and private to each server role',async()=>{
 const db=new PGlite();try{
  await db.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE bigk_server; CREATE ROLE bigk_staging_server; CREATE SCHEMA bigk; CREATE SCHEMA bigk_staging; GRANT USAGE ON SCHEMA bigk TO anon,authenticated,bigk_server; GRANT USAGE ON SCHEMA bigk_staging TO anon,authenticated,bigk_staging_server;');
  for(const schema of ['bigk','bigk_staging'] as const){const sql=b2bPostgresSchema(schema);assert.equal(readFileSync('supabase/b2b/'+schema+'.sql','utf8'),sql);await db.exec(sql);await db.exec(sql);}
  const insert="INSERT INTO bigk_staging.b2b_accounts(id,name,vat,email,contact,phone,address,postal,city,created_at,updated_at) VALUES('test','Shop','0123456749','test@example.test','Buyer','0123456789','Teststraat','1000','Brussel','2026-01-01','2026-01-01')";
  await db.exec('SET ROLE bigk_staging_server;'+insert);assert.equal((await db.query('SELECT * FROM bigk_staging.b2b_accounts')).rows.length,1);await assert.rejects(()=>db.exec('SELECT * FROM bigk.b2b_accounts'));
  for(const role of ['anon','authenticated']){await db.exec('RESET ROLE; SET ROLE '+role);for(const table of ['b2b_accounts','b2b_links','b2b_sessions','b2b_orders','b2b_events'])await assert.rejects(()=>db.exec('SELECT * FROM bigk_staging.'+table));}
  await db.exec('RESET ROLE');const result=await db.query<{relrowsecurity:boolean}>("SELECT relrowsecurity FROM pg_class WHERE relname LIKE 'b2b_%' AND relkind='r'");assert.equal(result.rows.length,10);assert.ok(result.rows.every(r=>r.relrowsecurity));
 }finally{await db.close();}
});
