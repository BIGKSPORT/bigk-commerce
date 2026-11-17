import {spawnSync} from 'node:child_process';
import {mkdirSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
const device=process.env.SPEED_DEVICE,output=join(process.env.RUNNER_TEMP,'bigk-speed-'+device);mkdirSync(output,{recursive:true});

if(device==='mobile'){
 for(const url of ['https://bigk.be/nl/products/alpin-fleecejas','https://bigk.be/en/products/snake-scarf-p023']){
  const res=await fetch(url,{signal:AbortSignal.timeout(45000)}),html=await res.text();
  if(res.status!==200)throw Error('Live product failed '+res.status);
  if(!html.includes('dpl_G1Uk22C5E74NkVdLA9jRNTna4itP'))throw Error('Unexpected production build; do not compare stale reports.');
  const schemas=[...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
  const group=schemas.flatMap(s=>s['@graph']||[s]).find(s=>s['@type']==='ProductGroup');
  if(!group?.hasVariant?.length)throw Error('Product group missing');
  for(const v of group.hasVariant){
   if(!v.name||!v.description)throw Error('Missing variant copy');
   if(v.sku&&/[\p{White_Space}\p{Cc}\p{Cs}]/u.test(v.sku))throw Error('Invalid search SKU');
   if(v.isVariantOf&&(!v.isVariantOf.name||!v.isVariantOf.description||v.isVariantOf['@id']!==group['@id']))throw Error('Invalid group reference');
   if(v.offers?.shippingDetails?.length!==5)throw Error('Shipping metadata missing');
  }
  console.log('LIVE_SEARCH_PASS '+JSON.stringify({url,variants:group.hasVariant.length,groupName:group.name,groupId:group['@id'],skus:group.hasVariant.map(v=>v.sku||null),shippingRates:group.hasVariant[0].offers.shippingDetails.map(s=>[s.shippingDestination.addressCountry,s.shippingRate.value]),productMetaRobots:html.match(/<meta[^>]*name="robots"[^>]*>/)?.[0]}));
 }
}

const targets=[{name:'home-1',url:'https://bigk.be/nl'},{name:'home-2',url:'https://bigk.be/nl'},{name:'home-3',url:'https://bigk.be/nl'},...(device==='mobile'?[{name:'product',url:'https://bigk.be/nl/products/alpin-fleecejas'}]:[])];
for(const target of targets){
 const path=join(output,target.name);
 const args=[process.env.LIGHTHOUSE_CLI,target.url,'--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage','--only-categories=performance','--output=json','--output=html','--output-path='+path,'--quiet',...(device==='desktop'?['--preset=desktop']:[])];
 const run=spawnSync(process.execPath,args,{encoding:'utf8',timeout:180000,maxBuffer:2e6});
 if(run.status!==0){console.log('SPEED_ERROR '+JSON.stringify({device,target,...run,error:run.error?.message}));process.exitCode=1;continue;}
 const r=JSON.parse(readFileSync(path+'.report.json','utf8')),a=r.audits;
 const names=['first-contentful-paint','largest-contentful-paint','speed-index','total-blocking-time','cumulative-layout-shift','interactive','server-response-time','total-byte-weight','mainthread-work-breakdown','bootup-time','unused-javascript','unused-css-rules','render-blocking-resources','modern-image-formats','uses-optimized-images','uses-responsive-images','offscreen-images','largest-contentful-paint-element','lcp-lazy-loaded','prioritize-lcp-image','uses-long-cache-ttl','redirects'];
 const audits=Object.fromEntries(names.filter(n=>a[n]).map(n=>[n,{score:a[n].score,value:a[n].numericValue,display:a[n].displayValue,details:a[n].details?.items?.slice(0,8)}]));
 const requests=a['network-requests']?.details?.items||[];
 console.log('SPEED_RESULT '+JSON.stringify({device,target,fetchTime:r.fetchTime,lighthouseVersion:r.lighthouseVersion,finalUrl:r.finalDisplayedUrl||r.finalUrl,performance:r.categories.performance.score*100,runtimeError:r.runtimeError,warnings:r.runWarnings,environment:r.environment,config:r.configSettings,audits,resources:requests.sort((x,y)=>(y.transferSize||0)-(x.transferSize||0)).slice(0,12),requestCount:requests.length}));
}
