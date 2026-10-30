import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {randomBytes,scryptSync} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const dir=await mkdtemp(join(tmpdir(),'bigk-auth-browser-'));
const password=randomBytes(24).toString('base64url'),salt=randomBytes(16).toString('hex');
const origin='http://localhost:3187';
const env={...process.env,NODE_ENV:'production',PORT:'3187',APP_URL:origin,DATABASE_PROVIDER:'sqlite',DATABASE_PATH:join(dir,'db.sqlite'),COMMERCE_MODE:'demo',ADMIN_PASSWORD_HASH:salt+':'+scryptSync(password,salt,64).toString('hex')};
for(const key of ['VERCEL','VERCEL_ENV','VERCEL_URL','VERCEL_BRANCH_URL','ADMIN_CANONICAL_ORIGIN','DATABASE_URL'])delete env[key];
let server,browser;
try{
 server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1'],{env,stdio:['ignore','ignore','ignore']});
 let ready=false;for(let i=0;i<80;i++){try{if((await fetch(origin+'/admin')).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,250));}assert(ready,'Next server did not start');
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage();
  await page.goto(origin+'/admin');await page.locator('input[name="password"]').fill('invalid-password');await page.getByRole('button',{name:'Sign in securely'}).click();await page.getByRole('alert').filter({hasText:'Incorrect password.'}).waitFor();
  await page.locator('input[name="password"]').fill(password);await page.getByRole('button',{name:'Sign in securely'}).click();await page.getByRole('button',{name:/sign out/i}).waitFor({timeout:15000});
  const before=(await context.cookies()).find(c=>c.name==='bigk_admin');assert(before?.httpOnly);assert.equal(before.sameSite,'Strict');assert(before.secure);
  await page.goto(origin+'/admin/shipping-test');assert.equal(await page.locator('h1').textContent(),'BIG K ® — DPD-testlabel');
  assert.equal((await page.request.get(origin+'/api/admin/master')).status(),200);
  assert.equal((await context.cookies()).find(c=>c.name==='bigk_admin')?.value,before.value);
  await page.getByRole('link',{name:'Naar de backoffice'}).click();await page.getByRole('button',{name:/sign out/i}).waitFor();
  assert.equal((await page.request.get(origin+'/api/admin/master')).status(),200);
  await context.close();console.log('PASS authenticated admin/shipping navigation and invalid password at '+width+'px');
 }
}finally{await browser?.close();server?.kill();await rm(dir,{recursive:true,force:true});}
