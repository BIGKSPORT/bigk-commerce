import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import {rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const databasePath=join(tmpdir(),`bigk-partner-application-${process.pid}.sqlite`);
process.env.DATABASE_PROVIDER='sqlite';
process.env.DATABASE_PATH=databasePath;
const {db,closeDatabase}=await import('../lib/db');
const {submitAmbassadorApplication,reviewAmbassadorApplication,attributeAmbassadorOrder,markAmbassadorCommissionEligible,approveAmbassadorCommission,createAmbassadorPayout,updateAmbassadorPayout,holdAmbassadorCommissionForRefund,reconcileAmbassadorRefund}=await import('../lib/ambassadors');

after(async()=>{await closeDatabase();for(const suffix of ['', '-shm', '-wal'])rmSync(databasePath+suffix,{force:true});});

test('partner application page shows coming soon and no form by default',async()=>{
 const previous=process.env.PARTNER_APPLICATIONS_ENABLED;
 delete process.env.PARTNER_APPLICATIONS_ENABLED;
 try{
  const {default:page}=await import('../app/ambassadors/apply/page');
  const html=renderToStaticMarkup(page());
  assert.match(html,/Binnenkort beschikbaar/);
  assert.doesNotMatch(html,/<form\\b|type="email"|name="fullName"/i);
 }finally{
  if(previous===undefined)delete process.env.PARTNER_APPLICATIONS_ENABLED;
  else process.env.PARTNER_APPLICATIONS_ENABLED=previous;
 }
});

test('partner application API is closed by default and stores nothing',async()=>{
 const previous=process.env.PARTNER_APPLICATIONS_ENABLED;
 delete process.env.PARTNER_APPLICATIONS_ENABLED;
 try{
  const {POST}=await import('../app/api/ambassadors/apply/route');
  const before=Number((await db().prepare('SELECT count(*) AS n FROM ambassador_applications').get()).n);
  const request=new Request('https://bigk.be/api/ambassadors/apply',{
   method:'POST',
   headers:{'content-type':'application/json'},
   body:JSON.stringify({
    fullName:'Must Not Be Stored',email:'disabled-gate@example.test',socialUrl:'https://example.test/profile',
    partnerType:'ambassador',organizationName:'',organizationType:'',
    audienceNote:'This request must be rejected while the server-side switch is off.',
    motivation:'Verify that disabled partner applications never reach persistence.',
    privacyAccepted:true,termsAccepted:true
   })
  });
  const response=await POST(request);
  assert.equal(response.status,503);
  assert.deepEqual(await response.json(),{error:'Partneraanvragen zijn momenteel gesloten. Binnenkort beschikbaar.'});
  const after=Number((await db().prepare('SELECT count(*) AS n FROM ambassador_applications').get()).n);
  assert.equal(after,before,'a disabled application must not be inserted');
  const rateLimit=await db().prepare("SELECT count(*) AS n FROM rate_limits WHERE key LIKE 'ambassador-application%'").get();
  assert.equal(Number(rateLimit.n),0,'a disabled application must be rejected before rate-limit or body processing');
 }finally{
  if(previous===undefined)delete process.env.PARTNER_APPLICATIONS_ENABLED;
  else process.env.PARTNER_APPLICATIONS_ENABLED=previous;
 }
});

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


test('refund holds commission and reconciles partial or full refunds without automatic payout',async()=>{
 const email=`refund-${process.pid}@example.test`;
 const application=await submitAmbassadorApplication({
  fullName:'Refund Lifecycle Test',email,socialUrl:'https://example.test/refunds',
  partnerType:'ambassador',organizationName:'',organizationType:'',
  audienceNote:'A test community for refund reconciliation.',
  motivation:'Exercise partner refund holds in an isolated automated test.',
  privacyAccepted:true,termsAccepted:true
 });
 const approval=await reviewAmbassadorApplication(application.id,'approve','test-admin','Refund test approval');
 const discountCode='discountCode' in approval?approval.discountCode:undefined;
 if(typeof discountCode!=='string')throw new Error('Partner approval did not create a partner code');
 const makeOrder=async()=>{
  const id=crypto.randomUUID(),now=new Date().toISOString();
  await db().prepare('INSERT INTO orders(id,status,subtotal,shipping,total,currency,email,phone,customer,receipt_hash,request_key,request_hash,created_at,expires_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
   .run(id,'paid',10000,0,10000,'eur','refund-customer@example.test','+32000000000','Refund Customer','receipt-test','request-'+id,'hash-test',now,now);
  assert.equal(await attributeAmbassadorOrder(id,discountCode,'refund-customer@example.test',10000,1000),true);
  await holdAmbassadorCommissionForRefund(id,'TEST-REFUND-'+id);
  assert.equal((await db().prepare('SELECT status FROM ambassador_commissions WHERE order_id=?').get(id)).status,'held');
  return id;
 };
 const partialOrder=await makeOrder();
 await reconcileAmbassadorRefund(partialOrder,4500,'test-admin');
 const partial=await db().prepare('SELECT status,commission_cents,eligible_product_net_cents FROM ambassador_commissions WHERE order_id=?').get(partialOrder);
 assert.equal(partial.status,'pending');
 assert.equal(partial.eligible_product_net_cents,4500);
 assert.equal(partial.commission_cents,450);
 const fullOrder=await makeOrder();
 await reconcileAmbassadorRefund(fullOrder,0,'test-admin');
 const full=await db().prepare('SELECT status,commission_cents FROM ambassador_commissions WHERE order_id=?').get(fullOrder);
 assert.equal(full.status,'reversed');
 assert.equal(full.commission_cents,0);
});
