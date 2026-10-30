import sharp from 'sharp';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const downloads=JSON.parse(await readFile(process.argv[2]||'/workspace/alpin-downloads.json','utf8'));
const report=JSON.parse(await readFile('docs/catalog-review/alpin-fleece-pro-review.json','utf8'));
const sources=JSON.parse(await readFile('docs/PRODUCT_IMAGE_SOURCES.json','utf8'));
const metrics=JSON.parse(await readFile('docs/PRODUCT_IMAGE_WEB_ASSETS.json','utf8'));
for(const colour of report.colours)for(const r of colour.images){
 const original=await readFile(downloads.find(d=>d.id===r.id).download.path),meta=await sharp(original).metadata();
 const originalPath='/products/drive/alpin-fleece-pro-'+r.id+'.'+r.name.split('.').at(-1);
 await mkdir('/workspace/bigk-product-masters/products/drive',{recursive:true});
 await copyFile(downloads.find(d=>d.id===r.id).download.path,'/workspace/bigk-product-masters'+originalPath);
 const base=sharp(original).rotate().toColourspace('srgb').resize({width:2400,height:2400,fit:'inside',withoutEnlargement:true});
 const web=await base.webp(r.name.endsWith('.png')?{lossless:true,effort:6}:{quality:94,effort:6,smartSubsample:true}).toBuffer();
 await writeFile('public'+r.webPath,web);
 const wm=await sharp(web).metadata(),sha=createHash('sha256').update(original).digest('hex'),webSha=createHash('sha256').update(web).digest('hex');
 sources.push({productId:colour.productId,sourceFolder:'Alpin Fleece Pro',sourceName:r.name,driveUrl:'https://drive.google.com/file/d/'+r.id+'/view',driveFileId:r.id,localPath:r.webPath,originalLocalPath:originalPath,sha256:sha,webSHA256:webSha,matchBasis:colour.code==='25303101'?'Owner-confirmed six-file Black selection; visually verified.':'Visually verified emerald/teal stand-collar fleece; hooded photos excluded.'});
 metrics.push({originalPath,webPath:r.webPath,originalBytes:original.length,webBytes:web.length,originalWidth:meta.width,originalHeight:meta.height,webWidth:wm.width,webHeight:wm.height,mode:r.name.endsWith('.png')?'lossless WebP, max 2400px, no crop':'quality 94, max 2400px, no crop',originalSHA256:sha,webSHA256:webSha});
}
const unique=(rows,key)=>[...new Map(rows.map(r=>[r[key],r])).values()];
await writeFile('docs/PRODUCT_IMAGE_SOURCES.json',JSON.stringify(unique(sources,'localPath'),null,2)+'\n');
await writeFile('docs/PRODUCT_IMAGE_WEB_ASSETS.json',JSON.stringify(unique(metrics,'webPath'),null,2)+'\n');
console.log('Installed 6 Black and 10 Emerald Green images; originals retained; no inventory or database changed.');
