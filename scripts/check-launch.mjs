// Reads settings only. Never prints credential values or opens a connection.
const staging=process.argv.includes('--staging'),mode=staging?'staging':'production';
const env=process.env,checks=[];
function check(name,ok){checks.push({name,ok:Boolean(ok)})}
check('Node.js 24 or later',Number(process.versions.node.split('.')[0])>=24);
check('PostgreSQL runtime',env.DATABASE_PROVIDER==='postgres');
check('Isolated database schema',env.DATABASE_SCHEMA===(staging?'bigk_staging':'bigk'));
let uri;try{uri=new URL(env.DATABASE_URL)}catch{}
check('Database connection configured',uri?.protocol==='postgresql:'||uri?.protocol==='postgres:');
check('Dedicated database login',uri?.username&&!['postgres','postgres.tvlfpxlfuatvtuiyrcam'].includes(uri.username));
let origin;try{origin=new URL(env.APP_URL)}catch{}
check('HTTPS application origin',origin?.protocol==='https:'&&origin.pathname==='/'&&!origin.search&&!origin.hash);
check('Expected website domain',staging?origin?.hostname.endsWith('.netlify.app'):origin?.hostname==='bigk.be');
check('Durable product photo storage',env.MEDIA_DRIVER==='database');
check('Hosting-safe upload limit',Number(env.MEDIA_UPLOAD_LIMIT_BYTES)>0&&Number(env.MEDIA_UPLOAD_LIMIT_BYTES)<=3145728);
check('Admin password hash',/^[a-f0-9]{32}:[a-f0-9]{128}$/.test(env.ADMIN_PASSWORD_HASH||''));
check('Receipt signing secret',(env.RECEIPT_SECRET||'').length>=32);
check('Matching Stripe environment',new RegExp('^(sk|rk)_'+(staging?'test':'live')+'_').test(env.STRIPE_SECRET_KEY||''));
check('Stripe webhook signing secret',(env.STRIPE_WEBHOOK_SECRET||'').startsWith('whsec_'));
check('Order/account email configured',env.RESEND_API_KEY&&env.EMAIL_FROM);
check('Staging stays out of search',staging?env.INDEXING_ENABLED!=='true':true);
for(const c of checks)console.log((c.ok?'PASS':'MISSING')+' '+c.name);
console.log('Scope: '+mode+' configuration only. This does not verify database permissions, provider activation, delivery, policies, inventory or an actual payment.');
if(checks.some(c=>!c.ok))process.exitCode=1;
