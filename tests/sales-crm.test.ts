import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {db} from '../lib/db';
import {salesDb} from '../lib/sales-db';
import {b2bDb} from '../lib/b2b-db';
import {hash} from '../lib/security';
import {GET,POST} from '../app/api/sales/crm/route';

const dir=mkdtempSync(join(tmpdir(),'bigk-sales-crm-'));
Object.assign(process.env,{DATABASE_PROVIDER:'sqlite',DATABASE_PATH:join(dir,'store.sqlite'),DATABASE_SCHEMA:'bigk',NODE_ENV:'test',APP_URL:'https://bigk.example',SELLER_PORTAL_ENABLED:'true'});
delete process.env.VERCEL;delete process.env.VERCEL_ENV;
const owner='bigk_admin=crm-owner',one='bigk_seller=crm-one',two='bigk_seller=crm-two';
function req(path:string,cookie='',data?:unknown){return new Request('https://bigk.example'+path,{method:data===undefined?'GET':'POST',headers:{cookie,origin:'https://bigk.example','Content-Type':'application/json'},...(data===undefined?{}:{body:JSON.stringify(data)})});}
test('B2B CRM enforces assigned ownership for sellers and global visibility for owner',async()=>{
 try{
  await db().prepare('INSERT INTO sessions VALUES(?,?)').run(hash('crm-owner'),new Date(Date.now()+600000).toISOString());
  const sellerOne=crypto.randomUUID(),sellerTwo=crypto.randomUUID(),now=new Date().toISOString();
  for(const [id,name,email,cookie] of [[sellerOne,'Seller One','crm-one@example.test','crm-one'],[sellerTwo,'Seller Two','crm-two@example.test','crm-two']] as const){
   await salesDb().prepare('INSERT INTO seller_accounts(id,name,email,created_at) VALUES(?,?,?,?)').run(id,name,email,now);
   await salesDb().prepare('INSERT INTO seller_sessions(hash,seller_id,account_version,expires_at) VALUES(?,?,1,?)').run(hash('seller:'+cookie),id,new Date(Date.now()+600000).toISOString());
  }
  const accountId=crypto.randomUUID();
  await b2bDb().prepare('INSERT INTO b2b_accounts(id,name,vat,email,contact,phone,address,postal,city,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(accountId,'CRM Test Shop','0123456749','crm-shop@example.test','Owner','0123456789','Teststraat 1','2000','Antwerpen',now,now);
  await b2bDb().prepare('INSERT INTO b2b_sessions(hash,account_id,account_version,expires_at) VALUES(?,?,1,?)').run(hash('crm-b2b-session'),accountId,new Date(Date.now()+600000).toISOString());
  let r=await POST(req('/api/sales/crm',owner,{action:'account.assign',accountId,sellerId:sellerOne}));assert.equal(r.status,200);
  const sellerOneData=await (await GET(req('/api/sales/crm',one))).json();
  const sellerTwoData=await (await GET(req('/api/sales/crm',two))).json();
  const ownerData=await (await GET(req('/api/sales/crm',owner))).json();
  assert.equal(sellerOneData.accounts.length,1);
  assert.equal(sellerTwoData.accounts.length,0);
  assert.equal(ownerData.accounts.length,1);
  assert.equal((await POST(req('/api/sales/crm',two,{action:'followup.create',accountId,dueAt:new Date(Date.now()+86400000).toISOString(),note:'Unauthorized call'}))).status,404);
  assert.equal((await POST(req('/api/sales/crm',two,{action:'account.contact',accountId,contact:'Intruder',email:'intruder@example.test',phone:'0123456789',address:'Otherstraat 2',postal:'2000',city:'Antwerpen'}))).status,404);
  assert.equal((await POST(req('/api/sales/crm',one,{action:'account.contact',accountId,contact:'Buyer Updated',email:'crm-shop@example.test',phone:'0987654321',address:'Nieuwe straat 3',postal:'2000',city:'Antwerpen'}))).status,200);
  assert.equal((await b2bDb().prepare('SELECT COUNT(*) AS n FROM b2b_sessions WHERE account_id=?').get(accountId))!.n,1,'unchanged login email must preserve active customer sessions');
  assert.equal((await POST(req('/api/sales/crm',one,{action:'account.contact',accountId,contact:'Buyer Updated',email:'updated-shop@example.test',phone:'0987654321',address:'Nieuwe straat 3',postal:'2000',city:'Antwerpen'}))).status,200);
  assert.equal((await b2bDb().prepare('SELECT COUNT(*) AS n FROM b2b_sessions WHERE account_id=?').get(accountId))!.n,0,'changing the login email must revoke customer sessions');
  assert.equal((await (await GET(req('/api/sales/crm',one))).json()).accounts[0].email,'updated-shop@example.test');
  r=await POST(req('/api/sales/crm',one,{action:'prospect.create',data:{companyName:'Seller One Lead',vat:'',contact:'Buyer',email:'lead-one@example.test',phone:'0123456789',notes:'First contact'}}));assert.equal(r.status,200);
  const prospectId=(await r.json()).id;
  assert.equal((await POST(req('/api/sales/crm',one,{action:'prospect.update',data:{id:prospectId,stage:'converted'}}))).status,400,'conversion must use the owner-controlled account-link action');
  assert.equal((await (await GET(req('/api/sales/crm',two))).json()).prospects.length,0);
  assert.equal((await POST(req('/api/sales/crm',two,{action:'prospect.update',data:{id:prospectId,stage:'lost'}}))).status,404);
  assert.equal((await POST(req('/api/sales/crm',owner,{action:'prospect.update',data:{id:prospectId,sellerId:sellerTwo}}))).status,200);
  assert.equal((await (await GET(req('/api/sales/crm',one))).json()).prospects.length,0);
  assert.equal((await (await GET(req('/api/sales/crm',two))).json()).prospects.length,1);
  assert.equal((await POST(req('/api/sales/crm',owner,{action:'followup.create',accountId,sellerId:sellerOne,dueAt:new Date(Date.now()+86400000).toISOString(),note:'Call next week'}))).status,200);
  const f=(await (await GET(req('/api/sales/crm',one))).json()).followups[0];
  assert.ok(f);
  assert.equal((await POST(req('/api/sales/crm',two,{action:'followup.complete',id:f.id}))).status,404);
  assert.equal((await POST(req('/api/sales/crm',owner,{action:'account.assign',accountId,sellerId:sellerTwo}))).status,200);
  assert.equal((await (await GET(req('/api/sales/crm',one))).json()).followups.length,0);
  assert.equal((await (await GET(req('/api/sales/crm',two))).json()).followups.length,1,'open account follow-ups transfer with account ownership');
  assert.equal((await POST(req('/api/sales/crm',two,{action:'followup.complete',id:f.id}))).status,200);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
