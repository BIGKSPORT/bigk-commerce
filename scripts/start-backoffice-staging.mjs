import {createInterface} from 'node:readline';
import {Writable} from 'node:stream';
import {randomBytes,scryptSync} from 'node:crypto';
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..'),port=Number(process.env.BIGK_STAGING_PORT||3000);
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Use a local port from 1024 to 65535.');
process.stdout.write('Choose an admin password of at least 16 characters (input hidden): ');
const hidden=new Writable({write(_chunk,_encoding,done){done()}}),rl=createInterface({input:process.stdin,output:hidden,terminal:true});
const password=await new Promise(resolve=>rl.question('',value=>{rl.close();resolve(value)}));
if(password.length<16){console.error('\nUse at least 16 characters.');process.exit(1)}
const salt=randomBytes(16).toString('hex'),env={...process.env,NODE_ENV:'development',APP_URL:'http://localhost:'+port,DATABASE_PROVIDER:'sqlite',DATABASE_URL:'',DATABASE_PATH:resolve(root,'data/bigk.sqlite'),MEDIA_PATH:resolve(root,'data/uploads'),COMMERCE_MODE:'demo',LIVE_COMMERCE_APPROVED:'false',BIGK_CLUB_ENABLED:'true',BIGK_CLUB_WAIT_DAYS:'30',ADMIN_PASSWORD_HASH:salt+':'+scryptSync(password,salt,64).toString('hex'),RECEIPT_SECRET:randomBytes(32).toString('hex'),RESEND_API_KEY:'',EMAIL_FROM:'',STRIPE_SECRET_KEY:'',STRIPE_WEBHOOK_SECRET:''};
if(!existsSync(env.DATABASE_PATH)){console.log('\nPreparing the owner-confirmed master on the local database.');const result=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,['--import','tsx','scripts/import-master-staging.ts'],{cwd:root,env,stdio:'inherit'});child.once('error',reject);child.once('exit',resolve)});if(result!==0)process.exit(1)}
console.log('\nOpen http://localhost:'+port+'/admin and use your chosen password.\nChanges persist in the local database. Payments and customer emails are disabled.\nStop with Ctrl+C.');
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port',String(port)],{cwd:root,env,stdio:'inherit'});process.on('SIGINT',()=>child.kill('SIGINT'));process.on('SIGTERM',()=>child.kill('SIGTERM'));child.once('exit',code=>process.exit(code||0));
