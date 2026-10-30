import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const db=await PGlite.create();
try{
 await db.exec('CREATE ROLE anon;CREATE ROLE authenticated;CREATE SCHEMA bigk;CREATE TABLE bigk.owner_sentinel(id integer);INSERT INTO bigk.owner_sentinel VALUES(7);');
 const sql=await readFile('supabase/staging/bigk-staging-bundle.sql','utf8');
 await db.exec(sql);
 assert.equal((await db.query('SELECT id FROM bigk.owner_sentinel')).rows[0].id,7);
 assert.equal((await db.query("SELECT count(*)::int n FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='bigk_staging' AND relkind='r' AND relrowsecurity")).rows[0].n,20);
 assert.equal((await db.query('SELECT sum(stock)::int n FROM bigk_staging.variants')).rows[0].n,5824);
 assert.equal((await db.query('SELECT count(*)::int n FROM bigk_staging.products WHERE active<>0 OR approved<>0')).rows[0].n,0);
 assert.equal((await db.query("SELECT has_schema_privilege('anon','bigk_staging','USAGE') allowed")).rows[0].allowed,false);
 await db.exec('SET ROLE bigk_staging_server;');
 assert.equal((await db.query('SELECT count(*)::int n FROM bigk_staging.products')).rows[0].n,27);
 await assert.rejects(()=>db.query('SELECT * FROM bigk.owner_sentinel'),/permission denied/);
 await assert.rejects(()=>db.exec('DELETE FROM bigk_staging.club_ledger'),/permission denied/);
 console.log('PASS isolated staging bundle: 20 RLS tables, 5824 units, draft-only catalogue, staging role separated from production; anonymous denied.');
}finally{await db.close()}
