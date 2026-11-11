import {readFile,readdir,mkdir,mkdtemp,rm,writeFile} from 'node:fs/promises';
import vm from 'node:vm';
import {gzipSync} from 'node:zlib';
import {spawn,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
const run=promisify(execFile),root=await mkdtemp(join(tmpdir(),'bigk-experience-audit-')),out=process.env.BIGK_ARTIFACT_DIR||join(root,'audit');await mkdir(out,{recursive:true});
const route='/[locale]/experience/page';
const parseManifest=async path=>{const context={};vm.runInNewContext(await readFile(path,'utf8'),context);return Object.values(context.__RSC_MANIFEST)[0];};
const own=await parseManifest('.next/server/app/[locale]/experience/page_client-reference-manifest.js');
const reference=Object.entries(own.clientModules).find(([path])=>path.endsWith('/components/experience/experience.tsx'))?.[1];
if(!reference)throw Error('Experience component missing from the production manifest.');
const files=reference.chunks.filter(f=>f.endsWith('.js')),other=new Set();
for(const file of await readdir('.next/server/app',{recursive:true}))if(file.endsWith('_client-reference-manifest.js')&&!file.includes('experience/')){
 const manifest=await parseManifest('.next/server/app/'+file);
 for(const module of Object.values(manifest.clientModules))for(const chunk of module.chunks)if(chunk.endsWith('.js'))other.add(chunk);
}
const unique=files.filter(f=>!other.has(f));let bytes=0,gzip=0,totalGzip=0;
for(const f of unique){const data=await readFile('.next/'+decodeURIComponent(f));bytes+=data.length;gzip+=gzipSync(data).length;}
const javascript={routeSpecificBytes:bytes,routeSpecificGzipBytes:gzip,initialJsGzipBytes:0,routeSpecificFiles:unique};
const lighthouse=process.env.LIGHTHOUSE_CLI;if(!lighthouse)throw Error('Set LIGHTHOUSE_CLI to the pinned test-only Lighthouse CLI path.');
const env={...process.env,CHROME_PATH:process.env.CHROMIUM_PATH||process.env.CHROME_PATH,NODE_ENV:'production',PORT:'3341',APP_URL:'http://127.0.0.1:3341',NEXT_PUBLIC_SHOP_EXPERIENCE_ENABLED:'true',DATABASE_PROVIDER:'sqlite',DATABASE_PATH:join(root,'unused.sqlite'),COMMERCE_MODE:'demo',EMAIL_DELIVERY_ENABLED:'false'};
for(const key of ['VERCEL','VERCEL_ENV','DATABASE_URL','DATABASE_SCHEMA','EXPERIENCE_STAGING_DATA','STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET'])delete env[key];
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1'],{env,stdio:'ignore'});
const results={javascript,lighthouse:{}};
try{
 for(let i=0;i<100;i++){try{if((await fetch(env.APP_URL+'/en/experience')).ok)break;}catch{}await new Promise(r=>setTimeout(r,200));}
 const html=await(await fetch(env.APP_URL+'/en/experience')).text();
 const initialFiles=new Set([...html.matchAll(/src="(\/_next\/[^"]+\.js(?:\?[^"]*)?)"/g)].map(match=>decodeURIComponent(match[1].split('?')[0].replace('/_next/',''))));
 for(const file of initialFiles)totalGzip+=gzipSync(await readFile('.next/'+file)).length;
 javascript.initialJsGzipBytes=totalGzip;
 for(const profile of ['mobile','desktop']){
  const path=join(out,'experience-lighthouse-'+profile+'.json'),args=[resolve(lighthouse),env.APP_URL+'/en/experience','--only-categories=performance,accessibility,best-practices,seo','--output=json','--output-path='+path,'--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage','--quiet'];
  if(profile==='desktop')args.push('--preset=desktop');
  await run(process.execPath,args,{env,timeout:180000,maxBuffer:2*1024*1024});
  const report=JSON.parse(await readFile(path,'utf8'));
  results.lighthouse[profile]={scores:Object.fromEntries(Object.entries(report.categories).map(([k,v])=>[k,Math.round(v.score*100)])),lcpMs:report.audits['largest-contentful-paint'].numericValue,cls:report.audits['cumulative-layout-shift'].numericValue,fcpMs:report.audits['first-contentful-paint'].numericValue,failedAudits:Object.values(report.audits).filter(a=>a.score!==null&&a.score<1&&a.scoreDisplayMode!=='informative'&&a.scoreDisplayMode!=='notApplicable').map(a=>({id:a.id,title:a.title,score:a.score,details:a.details?.items?.slice(0,4)}))};
 }
 await writeFile(join(out,'experience-measurements.json'),JSON.stringify(results,null,2));
 console.log('EXPERIENCE_MEASUREMENTS '+JSON.stringify(results));
}finally{server.kill('SIGTERM');await rm(root,{recursive:true,force:true});}
