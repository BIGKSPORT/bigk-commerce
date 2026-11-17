import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {channelPostgresSchema} from '../scripts/channel-schema';
await test('private channel tables provision twice and isolate browser/production/staging roles',async()=>{
 const db=new PGlite();try{
  await db.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE bigk_server; CREATE ROLE bigk_staging_server; CREATE SCHEMA bigk; CREATE SCHEMA bigk_staging; GRANT USAGE ON SCHEMA bigk TO anon,authenticated,bigk_server; GRANT USAGE ON SCHEMA bigk_staging TO anon,authenticated,bigk_staging_server;');
  for(const schema of ['bigk','bigk_staging'] as const){await db.exec(`CREATE TABLE ${schema}.variants(id TEXT PRIMARY KEY); INSERT INTO ${schema}.variants VALUES('v');`);const sql=channelPostgresSchema(schema);assert.equal(readFileSync('supabase/channels/'+schema+'.sql','utf8'),sql);await db.exec(sql);await db.exec(sql);}
  await db.exec("SET ROLE bigk_staging_server; INSERT INTO bigk_staging.channel_stock_policies(variant_id,buffer,updated_at) VALUES('v',5,'2026-01-01');");assert.equal((await db.query('SELECT buffer FROM bigk_staging.channel_stock_policies')).rows.length,1);await assert.rejects(()=>db.exec('SELECT * FROM bigk.channel_stock_policies'));
  for(const role of ['anon','authenticated']){await db.exec('RESET ROLE; SET ROLE '+role);for(const table of ['channel_stock_policies','channel_variant_links'])await assert.rejects(()=>db.exec('SELECT * FROM bigk_staging.'+table));}
  await db.exec('RESET ROLE');const r=await db.query<{relrowsecurity:boolean}>("SELECT relrowsecurity FROM pg_class WHERE relname IN ('channel_stock_policies','channel_variant_links') AND relkind='r'");assert.equal(r.rows.length,4);assert.ok(r.rows.every(r=>r.relrowsecurity));
 }finally{await db.close();}
});
