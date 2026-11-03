import {build} from 'esbuild';
import {mkdir,readFile,writeFile,cp} from 'node:fs/promises';
import {resolve} from 'node:path';
const out=resolve(process.env.PREVIEW_OUTPUT||'/workspace/sites/bigk-commerce-preview/dist');
await mkdir(out,{recursive:true});
await build({entryPoints:['preview/entry.tsx'],bundle:true,write:true,outfile:out+'/app.js',platform:'browser',jsx:'automatic',alias:{'next/image':resolve('preview/image.tsx'),'next/link':resolve('preview/link.tsx')},define:{'process.env.NODE_ENV':'"production"'},minify:true,plugins:[{name:'preview-navigation',setup(build){build.onLoad({filter:/app\/checkout\/page\.tsx$/},async args=>({contents:(await readFile(args.path,'utf8')).replace("window.location.assign(d.url)","window.dispatchEvent(new CustomEvent('bigk-preview-navigate',{detail:d.url}))").replace("window.location.assign(path('/order')+'#'+d.id+'.'+d.receiptToken)","window.dispatchEvent(new CustomEvent('bigk-preview-navigate',{detail:'/order#'+d.id+'.'+d.receiptToken}))"),loader:'tsx'}))}}]});
const css=await readFile('app/globals.css','utf8')+'\n'+await readFile('app/identity.css','utf8')+'\n.preview-notice{padding:10px 16px;background:#E4002B;color:#fff;font:700 11px Arial,sans-serif;letter-spacing:.08em;text-align:center}';
await writeFile(out+'/app.css',css);
await cp('public/brand',out+'/brand',{recursive:true});await cp('public/products/web',out+'/products/web',{recursive:true});await cp('public/icon.svg',out+'/icon.svg');
const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>BigK — Interactive Preview</title><meta name="description" content="Explore the BigK collection in this private interactive demonstration. Payments disabled."><link rel="icon" href="/icon.svg"><link rel="stylesheet" href="/app.css"></head><body><div id="root"></div><script src="/app.js" defer></script></body></html>';
await writeFile(out+'/index.html',html);
for(const path of ['checkout','order','account','admin','info/about','info/delivery','info/contact','info/privacy','info/terms']){await mkdir(out+'/'+path,{recursive:true});await writeFile(out+'/'+path+'/index.html',html)}
const seed=JSON.parse(await readFile('lib/catalog.json','utf8'));for(const p of seed.products){await mkdir(out+'/products/'+p.slug,{recursive:true});await writeFile(out+'/products/'+p.slug+'/index.html',html)}
await writeFile(out+'/_headers','/*\n  Cache-Control: no-cache\n  X-Robots-Tag: noindex, nofollow\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: same-origin\n  Content-Security-Policy: default-src \'self\'; script-src \'self\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data:; connect-src \'self\'; frame-ancestors \'none\'; base-uri \'self\'; form-action \'self\'\n');
console.log('Interactive preview built: '+out);
