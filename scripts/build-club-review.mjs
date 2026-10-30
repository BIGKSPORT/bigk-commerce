import {build} from 'esbuild';
import {mkdir,readFile,writeFile,cp} from 'node:fs/promises';
import {resolve} from 'node:path';
const out='/workspace/bigk-club-review';await mkdir(out,{recursive:true});
await build({entryPoints:['preview/club-review.tsx'],bundle:true,outfile:out+'/app.js',platform:'browser',jsx:'automatic',alias:{'next/link':resolve('preview/link.tsx')},define:{'process.env.NODE_ENV':'"production"'},minify:true});
await cp('public/brand',out+'/brand',{recursive:true});
await writeFile(out+'/app.css',await readFile('app/globals.css','utf8')+'\n'+await readFile('app/identity.css','utf8')+'\n.review-toolbar{padding:16px 5%;display:flex;align-items:center;gap:18px;flex-wrap:wrap;background:#f7f6f5;border-bottom:3px solid #E4002B;font-size:11px}.review-toolbar strong{width:100%}.review-toolbar select{margin-left:10px;padding:8px}.review-toolbar button{border:1px solid #2D2926;padding:9px 15px}.simple-header{position:static}');
await writeFile(out+'/index.html','<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BigK Club — Local Review</title><link rel="stylesheet" href="app.css"></head><body><div id="root"></div><script src="app.js"></script></body></html>');
console.log('Local-only BigK Club review: '+out+'/index.html');
