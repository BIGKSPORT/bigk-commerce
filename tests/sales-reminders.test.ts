import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {salesDb} from '../lib/sales-db';
import {b2bDb} from '../lib/b2b-db';
import {sendSalesFollowupReminders} from '../lib/sales-reminders';

const dir=mkdtempSync(join(tmpdir(),'bigk-sales-reminders-'));
Object.assign(process.env,{DATABASE_PROVIDER:'sqlite',DATABASE_PATH:join(dir,'store.sqlite'),DATABASE_SCHEMA:'bigk',NODE_ENV:'test',APP_URL:'https://bigk.example',SELLER_PORTAL_ENABLED:'true',EMAIL_DELIVERY_ENABLED:'true',EMAIL_FROM:'BIG K <noreply@bigk.example>',RESEND_API_KEY:'re_test_fixture',VERCEL_ENV:'production'});
test('daily follow-up digest is seller-scoped and idempotent',async()=>{
 const originalFetch=globalThis.fetch;
 try{
  const sellerId=crypto.randomUUID(),now='2026-11-21T07:00:00.000Z';
  await b2bDb();
  await salesDb().prepare('INSERT INTO seller_accounts(id,name,email,created_at) VALUES(?,?,?,?)').run(sellerId,'Seller One','seller-one@example.test',new Date().toISOString());
  const prospectId=crypto.randomUUID(),created=new Date().toISOString();
  await salesDb().prepare('INSERT INTO seller_prospects(id,seller_id,company_name,vat,contact,email,phone,stage,notes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(prospectId,sellerId,'Test Shop','','Buyer','buyer@example.test','','prospect','',created,created);
  await salesDb().prepare('INSERT INTO seller_followups(id,seller_id,prospect_id,due_at,note,created_at) VALUES(?,?,?,?,?,?)').run(crypto.randomUUID(),sellerId,prospectId,'2026-11-21T09:00:00.000Z','Call about the winter collection',created);
  let calls=0,payload:any=null;
  globalThis.fetch=(async(_url:any,init:any)=>{calls++;payload=JSON.parse(String(init.body));return new Response(JSON.stringify({id:'email-fixture'}),{status:200,headers:{'Content-Type':'application/json'}})}) as typeof fetch;
  const first=await sendSalesFollowupReminders(new Date(now));
  assert.deepEqual(first,{sent:1,failed:0,skipped:0});
  assert.equal(calls,1);assert.equal(payload.to,'seller-one@example.test');assert.match(payload.text,/Test Shop/);assert.match(payload.html,/winter collection/);
  const second=await sendSalesFollowupReminders(new Date(now));
  assert.deepEqual(second,{sent:0,failed:0,skipped:1});assert.equal(calls,1);
  const event=await salesDb().prepare("SELECT action FROM seller_events WHERE id=?").get('followup-reminder:'+sellerId+':2026-11-21');
  assert.equal(event?.action,'followup.reminder_sent');
 }finally{globalThis.fetch=originalFetch;rmSync(dir,{recursive:true,force:true});}
});
