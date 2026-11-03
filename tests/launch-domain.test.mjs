import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {fileURLToPath} from 'node:url';

const script=fileURLToPath(new URL('../scripts/check-launch.mjs',import.meta.url));
const source=readFileSync(script,'utf8');
const stagingOrigin='https://bigk-commerce-git-fix-catalogue-colour-options-hello-35126091.vercel.app';
// Completely synthetic environment: this test never reads credentials or contacts a provider.
function check(origin,staging=true,overrides={}){
 const env={
  DATABASE_PROVIDER:'postgres',DATABASE_SCHEMA:staging?'bigk_staging':'bigk',
  DATABASE_URL:'postgresql://bigk_fixture:fixture-password@127.0.0.1:5432/fixture',
  APP_URL:origin,MEDIA_DRIVER:'database',MEDIA_UPLOAD_LIMIT_BYTES:'3145728',
  ADMIN_PASSWORD_HASH:'a'.repeat(32)+':'+ 'b'.repeat(128),RECEIPT_SECRET:'fixture-receipt-secret-'.repeat(3),
  STRIPE_SECRET_KEY:staging?'rk_test_fixture_only':'rk_live_fixture_only',
  STRIPE_WEBHOOK_SECRET:'whsec_fixture_only',RESEND_API_KEY:'fixture-email-key',
  EMAIL_FROM:'Fixture <fixture@example.test>',INDEXING_ENABLED:'false',...overrides
 };
 const output=[],fakeProcess={argv:['node',script,...(staging?['--staging']:[])],env,versions:{node:process.versions.node},exitCode:0};
 runInNewContext(source,{process:fakeProcess,URL,console:{log:value=>output.push(String(value))}},{filename:script,timeout:1000});
 const result={status:fakeProcess.exitCode,stdout:output.join('\n')};
 for(const value of [env.DATABASE_URL,env.ADMIN_PASSWORD_HASH,env.RECEIPT_SECRET,env.STRIPE_SECRET_KEY,env.STRIPE_WEBHOOK_SECRET,env.RESEND_API_KEY])assert(!result.stdout.includes(value),'Checker must not print fixture credential values');
 return result;
}

test('the authorized staging branch and production apex each pass with matching isolated settings',()=>{
 assert.equal(check(stagingOrigin).status,0);
 assert.equal(check('https://bigk.be',false).status,0);
});

for(const origin of [
 'https://old-preview.netlify.app',
 'https://unrelated.vercel.app',
 'https://bigk-commerce-git-main-hello-35126091.vercel.app',
 'https://bigk-commerce-git-fix-catalogue-colour-options-other-team.vercel.app',
 stagingOrigin+'.example.test',
 'https://bigk.be',
 stagingOrigin+':8443',
 'http://'+new URL(stagingOrigin).host,
 stagingOrigin+'/checkout',
 stagingOrigin+'?preview=true',
 stagingOrigin+'#fragment',
 'https://fixture-user:fixture-password@'+new URL(stagingOrigin).host,
 'not a URL'
])test('staging rejects an unauthorized or malformed application origin: '+origin,()=>{
 const result=check(origin);assert.equal(result.status,1);assert.match(result.stdout,/MISSING (Expected website domain|HTTPS application origin)/);
});

for(const origin of [stagingOrigin,'https://www.bigk.be','https://bigk.be.example.test','https://bigk.be:8443'])test('production accepts only its authorized apex, not '+origin,()=>{
 const result=check(origin,false);assert.equal(result.status,1);assert.match(result.stdout,/MISSING Expected website domain/);
});

test('the staging schema, Stripe mode and indexing gates remain enforced',()=>{
 assert.match(check(stagingOrigin,true,{DATABASE_SCHEMA:'bigk'}).stdout,/MISSING Isolated database schema/);
 assert.match(check(stagingOrigin,true,{STRIPE_SECRET_KEY:'rk_live_fixture_only'}).stdout,/MISSING Matching Stripe environment/);
 assert.match(check(stagingOrigin,true,{INDEXING_ENABLED:'true'}).stdout,/MISSING Staging stays out of search/);
});
