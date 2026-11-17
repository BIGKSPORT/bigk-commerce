import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {salesDb} from '../lib/sales-db';
import {db,closeDatabase} from '../lib/db';
import {commissionMonth,commissionStatements,recordCommissionPayout} from '../lib/sales-commissions';
import {hash} from '../lib/security';
import {POST as admin} from '../app/api/sales/admin/route';
import {salesSellerPreview} from '../lib/sales-service';
import type {SalesActor} from '../lib/sales-types';
const dir=mkdtempSync(join(tmpdir(),'bigk-commission-'));
Object.assign(process.env,{DATABASE_PROVIDER:'sqlite',DATABASE_PATH:join(dir,'store.sqlite'),DATABASE_SCHEMA:'bigk',NODE_ENV:'test',APP_URL:'https://bigk.example',SELLER_PORTAL_ENABLED:'true',ADMIN_MFA_REQUIRED:'false'});delete process.env.VERCEL;delete process.env.VERCEL_ENV;
const owner:SalesActor={id:'owner',name:'BIG K',role:'owner'},seller:SalesActor={id:crypto.randomUUID(),name:'Seller',role:'seller'},other:SalesActor={id:crypto.randomUUID(),name:'Other',role:'seller'};
function req(cookie:string,data:unknown,query='',origin='https://bigk.example'){return new Request('https://bigk.example/api/sales/admin'+query,{method:'POST',headers:{cookie,origin,'Content-Type':'application/json'},body:JSON.stringify(data)});}
await test('monthly commission ledger',async t=>{try{
 const customerId=crypto.randomUUID();
 for(const a of [seller,other])await salesDb().prepare('INSERT INTO seller_accounts(id,name,email,created_at) VALUES(?,?,?,?)').run(a.id,a.name,a.id+'@example.test','2025-01-01');
 await salesDb().prepare('INSERT INTO seller_customers(id,seller_id,name,vat,contact,email,phone,address,created_at) VALUES(?,?,?,?,?,?,?,?,?)').run(customerId,seller.id,'Shop','0123456749','Contact','shop@example.test','0123456789','Brussels','2025-01-01');
 async function order(sellerId:string,at:string,status='paid',bonus=0){const id=crypto.randomUUID();await salesDb().prepare('INSERT INTO seller_orders(id,seller_id,customer_id,status,terms,quote,earned_cents,request_key,request_hash,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(id,sellerId,customerId,status,'proforma',JSON.stringify({subtotal:120000,bonus,rate:0.12,commission:14400+bonus,lines:[]}),status==='paid'?14400+bonus:0,crypto.randomUUID(),'fixture','2024-12-01T10:00:00Z',at);return id;}
 await t.test('complete history, payment month rather than booking month, no unpaid orders, seller isolation',async()=>{
  for(let i=0;i<205;i++)await order(seller.id,'2025-01-15T10:00:00Z','paid',i===0?10000:0);
  await order(seller.id,'2025-01-15T10:00:00Z','submitted');await order(seller.id,'2025-01-15T10:00:00Z','draft');await order(seller.id,'2025-01-15T10:00:00Z','cancelled');await order(other.id,'2025-01-15T10:00:00Z');
  const statements=await commissionStatements(seller);assert.equal(statements.length,1);assert.equal(statements[0].lines.length,205);assert.equal(statements[0].totalCents,205*14400+10000);assert.equal(statements[0].month,'2025-01');assert.equal(statements[0].dueDate,'2025-02-10');assert.equal((await commissionStatements(owner)).length,2);
  const preview=await salesSellerPreview(owner,seller.id);assert.equal(preview.commissions!.length,1);assert.equal(preview.commissions![0].sellerId,seller.id);
 });
 await t.test('Belgian month boundary, December rollover, and current month stays open',async()=>{
  assert.equal(commissionMonth(new Date('2025-03-31T22:30:00Z')),'2025-04');
  await order(seller.id,'2025-12-15T10:00:00Z');const s=(await commissionStatements(seller,new Date('2025-12-20T10:00:00Z'))).find(s=>s.month==='2025-12')!;assert.equal(s.closed,false);assert.equal(s.dueDate,'2026-01-10');
  await order(seller.id,new Date().toISOString());const current=(await commissionStatements(seller)).find(s=>!s.closed)!;await assert.rejects(()=>recordCommissionPayout(owner,{...current,reference:'CURRENT'}),/lopende maand/);
 });
 await t.test('owner only, exact snapshot, closed month, duplicate references and concurrent duplicate protection',async()=>{
  const s=(await commissionStatements(seller)).find(s=>s.month==='2025-01')!,input={sellerId:s.sellerId,month:s.month,key:s.key,totalCents:s.totalCents,reference:'BANK-COMMISSION-01'};
  await assert.rejects(()=>recordCommissionPayout(seller,input),/Alleen BIG K/);
  await assert.rejects(()=>recordCommissionPayout(owner,{...input,totalCents:1}),/gewijzigd/);
  await assert.rejects(()=>recordCommissionPayout(owner,{...input,key:'bad'}),/gewijzigd/);
  const results=await Promise.allSettled([recordCommissionPayout(owner,input),recordCommissionPayout(owner,input)]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  const after=(await commissionStatements(seller)).find(s=>s.month==='2025-01')!;assert.equal(after.payout!.reference,input.reference);assert.equal(after.totalCents,s.totalCents);
  const second=(await commissionStatements(other))[0];await assert.rejects(()=>recordCommissionPayout(owner,{...second,reference:input.reference}),/al gebruikt/);
 });
 await t.test('admin endpoint enforces login, CSRF, preview read-only and schema validation',async()=>{
  await db().prepare('INSERT INTO sessions VALUES(?,?)').run(hash('commission-owner'),new Date(Date.now()+600000).toISOString());
  const s=(await commissionStatements(other))[0],body={action:'commissionPaid',sellerId:s.sellerId,month:s.month,key:s.key,totalCents:s.totalCents,reference:'BANK-OTHER'};
  assert.equal((await admin(req('',body))).status,403);
  assert.equal((await admin(req('bigk_admin=commission-owner',body,'','https://evil.example'))).status,403);
  assert.equal((await admin(req('bigk_admin=commission-owner',body,'?previewSeller='+other.id))).status,403);
  assert.equal((await admin(req('bigk_admin=commission-owner',{...body,month:'2025-99'}))).status,400);
  assert.equal((await admin(req('bigk_admin=commission-owner',{...body,totalCents:1}))).status,409);
  assert.equal((await admin(req('bigk_admin=commission-owner',body))).status,200);
 });
}finally{await closeDatabase();rmSync(dir,{recursive:true,force:true});}});
