import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const databasePath=join(tmpdir(),`bigk-partner-application-${process.pid}.sqlite`);
process.env.DATABASE_PROVIDER='sqlite';
process.env.DATABASE_PATH=databasePath;
const {db,closeDatabase}=await import('../lib/db');
const {submitAmbassadorApplication,reviewAmbassadorApplication,attributeAmbassadorOrder,markAmbassadorCommissionEligible,approveAmbassadorCommission,createAmbassadorPayout,updateAmbassadorPayout}=await import('../lib/ambassadors');

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

test('approved partner commission is held until delivery, then reviewed and paid manually',async()=>{
 const email=`lifecycle-${process.pid}@example.test`;
 const application=await submitAmbassadorApplication({
  fullName:'Lifecycle Partner Test',email,socialUrl:'https://example.test/lifecycle',
  partnerType:'ambassador',organizationName:'',organizationType:'',
  audienceNote:'A test community for the partner commission lifecycle.',
  motivation:'Exercise the complete manual approval and payout path safely.',
  privacyAccepted:true,termsAccepted:true
 });
 const approval=await reviewAmbassadorApplication(application.id,'approve','test-admin','Automated lifecycle approval');
 assert.equal(approval.status,'approved');
 const discountCode='discountCode' in approval?approval.discountCode:undefined,ambassadorId='ambassadorId' in approval?approval.ambassadorId:undefined;
 if(typeof discountCode!=='string'||typeof ambassadorId!=='string')throw new Error('Partner approval did not create a partner code');
 const orderId=crypto.randomUUID(),now=new Date().toISOString();
 await db().prepare('INSERT INTO orders(id,status,subtotal,shipping,total,currency,email,phone,customer,receipt_hash,request_key,request_hash,created_at,expires_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
  .run(orderId,'paid',10000,0,10000,'eur','customer@example.test','+32000000000','Lifecycle Customer','receipt-test','request-'+orderId,'hash-test',now,now);
 assert.equal(await attributeAmbassadorOrder(orderId,discountCode,'customer@example.test',10000,1000),true);
 let commission=await db().prepare('SELECT status,commission_cents FROM ambassador_commissions WHERE order_id=?').get(orderId);
 assert.equal(commission.status,'pending');assert.equal(commission.commission_cents,0);
 await markAmbassadorCommissionEligible(orderId,'test-admin','2026-11-20T10:00:00.000Z','2026-11-21T10:00:00.000Z',9000);
 commission=await db().prepare('SELECT status,commission_cents FROM ambassador_commissions WHERE order_id=?').get(orderId);
 assert.equal(commission.status,'eligible');assert.equal(commission.commission_cents,900);
 await approveAmbassadorCommission(orderId,'test-admin');
 const day=new Date().toISOString().slice(0,10);
 const payout=await createAmbassadorPayout(ambassadorId,day,day,'test-admin','TEST-INVOICE-001');
 assert.equal(payout.amountCents,900);
 await updateAmbassadorPayout(payout.id,'approve','test-admin','');
 await updateAmbassadorPayout(payout.id,'paid','test-admin','TEST-BANK-REFERENCE');
 commission=await db().prepare('SELECT status FROM ambassador_commissions WHERE order_id=?').get(orderId);
 const payoutRow=await db().prepare('SELECT status,amount_cents FROM ambassador_payouts WHERE id=?').get(payout.id);
 assert.equal(commission.status,'paid');assert.equal(payoutRow.status,'paid');assert.equal(payoutRow.amount_cents,900);
 assert.equal((await db().prepare('SELECT count(*) n FROM ambassador_team_bonus_ledger').get()).n,0);
});
