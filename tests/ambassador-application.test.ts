import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const databasePath=join(tmpdir(),`bigk-partner-application-${process.pid}.sqlite`);
process.env.DATABASE_PROVIDER='sqlite';
process.env.DATABASE_PATH=databasePath;
const {db,closeDatabase}=await import('../lib/db');
const {submitAmbassadorApplication}=await import('../lib/ambassadors');

after(async()=>{await closeDatabase();for(const suffix of ['', '-shm', '-wal'])rmSync(databasePath+suffix,{force:true});});

test('partner application persists partner type and organisation fields with consent timestamps',async()=>{
 const result=await submitAmbassadorApplication({
  fullName:'Preview Partner Test',email:`preview-${process.pid}@example.test`,socialUrl:'https://example.test/community',
  partnerType:'club',organizationName:'Running Club Test',organizationType:'running',
  audienceNote:'A running community for this isolated automated test.',motivation:'We want to test the partner application insert safely.',
  privacyAccepted:true,termsAccepted:true
 });
 assert.equal(result.status,'pending');
 const row=await db().prepare('SELECT partner_type,organization_name,organization_type,privacy_accepted_at,terms_accepted_at,terms_version,status FROM ambassador_applications WHERE id=?').get(result.id);
 assert.equal(row.partner_type,'club');
 assert.equal(row.organization_name,'Running Club Test');
 assert.equal(row.organization_type,'running');
 assert.ok(typeof row.privacy_accepted_at==='string'&&String(row.privacy_accepted_at).length>0);
 assert.ok(typeof row.terms_accepted_at==='string'&&String(row.terms_accepted_at).length>0);
 assert.equal(row.terms_version,'0.4-2026-11-22');
 assert.equal(row.status,'pending');
});
