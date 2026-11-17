import {spawnSync} from 'node:child_process';
import {mkdirSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
const device=process.env.SPEED_DEVICE,output=join(process.env.RUNNER_TEMP,'bigk-speed-'+device);mkdirSync(output,{recursive:true});
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
