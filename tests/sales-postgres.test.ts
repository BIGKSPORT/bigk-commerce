import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {salesPostgresSchema} from '../scripts/sales-schema';
import {readFileSync} from 'node:fs';
await test('PostgreSQL schema isolates anonymous, authenticated, staging and production access',async()=>{
 const db=new PGlite();try{
 await db.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE bigk_server; CREATE ROLE bigk_staging_server; CREATE SCHEMA bigk; CREATE SCHEMA bigk_staging; GRANT USAGE ON SCHEMA bigk TO anon,authenticated,bigk_server; GRANT USAGE ON SCHEMA bigk_staging TO anon,authenticated,bigk_staging_server;');
 for(const schema of ['bigk','bigk_staging'] as const){const sql=salesPostgresSchema(schema);assert.equal(readFileSync('supabase/sales/'+schema+'.sql','utf8'),sql);await db.exec(sql);await db.exec(sql);}
 await db.exec("SET ROLE bigk_staging_server; INSERT INTO bigk_staging.seller_accounts(id,name,email,created_at) VALUES('one','One','one@test.example','2026-11-16');");
 assert.equal((await db.query('SELECT * FROM bigk_staging.seller_accounts')).rows.length,1);
 await assert.rejects(()=>db.exec('SELECT * FROM bigk.seller_accounts'));
 for(const role of ['anon','authenticated']){await db.exec('RESET ROLE; SET ROLE '+role);await assert.rejects(()=>db.exec('SELECT * FROM bigk_staging.seller_accounts'));await assert.rejects(()=>db.exec("INSERT INTO bigk_staging.seller_accounts(id,name,email,created_at) VALUES('x','X','x@test.example','now')"));}
 await db.exec('RESET ROLE;');const result=await db.query<{relrowsecurity:boolean}>("SELECT relrowsecurity FROM pg_class WHERE relname LIKE 'seller_%' AND relkind='r'");assert.equal(result.rows.length,10);assert.ok(result.rows.every(r=>r.relrowsecurity));
 }finally{await db.close();}
});
