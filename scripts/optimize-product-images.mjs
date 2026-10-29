// Web delivery derivatives; source masters remain outside the deployed website.
// PRODUCT_MASTERS_DIR must contain products/drive/<original filename>.
import sharp from 'sharp';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,basename} from 'node:path';
const masters=process.env.PRODUCT_MASTERS_DIR;
if(!masters) throw Error('Set PRODUCT_MASTERS_DIR to your local master-photo directory. Originals stay in Drive.');
sharp.concurrency(2);
const sources=JSON.parse(await readFile('docs/PRODUCT_IMAGE_SOURCES.json','utf8'));
const unique=[...new Set(sources.map(s=>s.originalLocalPath||s.localPath))];
const records=[];
await mkdir('public/products/web',{recursive:true});
for(const source of unique){
 const input=resolve(masters,'.'+source);
 const original=await readFile(input), metadata=await sharp(original).metadata();
 const lossless=metadata.format==='png';
 const filename=basename(source).replace(/\.[^.]+$/,'.webp');
 const outputPath='/products/web/'+filename;
 const pipeline=sharp(original).rotate().toColourspace('srgb');
 if(!lossless)pipeline.resize({width:2400,height:2400,fit:'inside',withoutEnlargement:true});
 const reference=await pipeline.clone().removeAlpha().raw().toBuffer({resolveWithObject:true});
 const encoded=await pipeline.webp(lossless?{lossless:true,effort:6}:{quality:94,effort:6,smartSubsample:true}).toBuffer();
 const decoded=await sharp(encoded).removeAlpha().raw().toBuffer({resolveWithObject:true});
 if(reference.info.width!==decoded.info.width||reference.info.height!==decoded.info.height)throw Error('Unexpected image dimensions: '+source);
 if(lossless&&!reference.data.equals(decoded.data))throw Error('Lossless pixel check failed: '+source);
 let error=0,samples=0;
 for(let i=0;i<reference.data.length;i+=12){const delta=reference.data[i]-decoded.data[i];error+=delta*delta;samples++;}
 const psnr=error===0?null:10*Math.log10(255*255/(error/samples));
 await writeFile('public'+outputPath,encoded);
 const record={originalPath:source,webPath:outputPath,originalBytes:original.length,webBytes:encoded.length,originalWidth:metadata.width,originalHeight:metadata.height,webWidth:decoded.info.width,webHeight:decoded.info.height,mode:lossless?'lossless, original dimensions':'quality 94, maximum 2400px long edge',sampledPSNR:psnr===null?null:Number(psnr.toFixed(2)),originalSHA256:createHash('sha256').update(original).digest('hex'),webSHA256:createHash('sha256').update(encoded).digest('hex')};
 records.push(record);
}
await writeFile('docs/PRODUCT_IMAGE_WEB_ASSETS.json',JSON.stringify(records,null,2)+'\n');
const mapping=new Map(records.map(x=>[x.originalPath,x]));
const catalog=JSON.parse(await readFile('lib/catalog.json','utf8'));
for(const product of catalog.products)product.images=product.images.map(path=>mapping.get(path)?.webPath||path);
await writeFile('lib/catalog.json',JSON.stringify(catalog,null,2)+'\n');
const editorial=JSON.parse(await readFile('lib/editorial.json','utf8'));
editorial.hero.image=mapping.get(editorial.hero.image)?.webPath||editorial.hero.image;
for(const key of Object.keys(editorial.categories))editorial.categories[key]=mapping.get(editorial.categories[key])?.webPath||editorial.categories[key];
await writeFile('lib/editorial.json',JSON.stringify(editorial,null,2)+'\n');
for(const source of sources){const old=source.originalLocalPath||source.localPath;const record=mapping.get(old);source.originalLocalPath=old;source.localPath=record.webPath;source.webSHA256=record.webSHA256;}
await writeFile('docs/PRODUCT_IMAGE_SOURCES.json',JSON.stringify(sources,null,2)+'\n');
const original=records.reduce((s,r)=>s+r.originalBytes,0),web=records.reduce((s,r)=>s+r.webBytes,0);
console.log(JSON.stringify({images:records.length,originalBytes:original,webBytes:web,reductionPercent:Number((100*(1-web/original)).toFixed(1)),losslessPNGs:records.filter(r=>r.mode.startsWith('lossless')).length}));
