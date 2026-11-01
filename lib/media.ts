import staticProductMedia from './static-product-media.json';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import sharp from 'sharp';
import {HttpError} from './security';
import {db,transaction} from './db';
export const mediaRoot=()=>resolve(process.env.MEDIA_PATH||'data/uploads');
export function mediaDriver(){const driver=process.env.MEDIA_DRIVER||((process.env.NETLIFY==='true'||process.env.VERCEL==='1')?'database':'filesystem');if(!['filesystem','database'].includes(driver))throw new Error('MEDIA_DRIVER must be filesystem or database.');if((process.env.NETLIFY==='true'||process.env.VERCEL==='1')&&driver!=='database')throw new Error('Serverless deployments require MEDIA_DRIVER=database for durable uploads.');return driver}
export function mediaUploadLimit(){const n=Number(process.env.MEDIA_UPLOAD_LIMIT_BYTES||((process.env.NETLIFY==='true'||process.env.VERCEL==='1')?3145728:16777216));if(!Number.isSafeInteger(n)||n<1||n>16777216)throw Error('MEDIA_UPLOAD_LIMIT_BYTES must be between 1 and 16777216.');return n}
export type MediaItem={id:string;url:string;name:string;width:number;height:number;bytes:number;createdAt:string};
const limit=()=>{const value=Number(process.env.MEDIA_DATABASE_LIMIT_BYTES||134217728);if(!Number.isSafeInteger(value)||value<1)throw Error('Invalid media database quota.');return value};
export async function storeImage(data:Uint8Array,name:string):Promise<MediaItem>{
 if(!data.length||data.length>mediaUploadLimit())throw new HttpError(413,'Use a JPEG, PNG or WebP within the configured upload allowance.');
 const image=sharp(data,{limitInputPixels:50000000,animated:false,failOn:'warning'});let meta;try{meta=await image.metadata()}catch{throw new HttpError(400,'This image cannot be read. Use a JPEG, PNG or WebP file.')}
 if(!['jpeg','png','webp'].includes(meta.format||'')||(meta.pages||1)>1)throw new HttpError(400,'Only still JPEG, PNG and WebP images are accepted.');
 const id=createHash('sha256').update(data).digest('hex');
 const converted=await image.rotate().resize({width:2400,height:2400,fit:'inside',withoutEnlargement:true}).webp(meta.format==='png'?{lossless:true}:{quality:94,effort:5}).toBuffer({resolveWithObject:true});
 const item:MediaItem={id,url:'/api/media/'+id+'.webp',name:name.replace(/[\u0000-\u001f/\\]/g,'').slice(0,180)||'Product photo',width:converted.info.width,height:converted.info.height,bytes:converted.data.length,createdAt:new Date().toISOString()};
 if(mediaDriver()==='database')return transaction(async()=>{const existing=await db().prepare('SELECT metadata FROM media_assets WHERE id=?').get(id);if(existing)return JSON.parse(String(existing.metadata)) as MediaItem;const row=await db().prepare('SELECT COALESCE(SUM(original_bytes+web_bytes),0) AS bytes FROM media_assets').get();if(Number(row?.bytes||0)+data.length+converted.data.length>limit())throw new HttpError(409,'The media allowance is full. Review storage before uploading more photos.');await db().prepare('INSERT INTO media_assets(id,metadata,original,web,original_bytes,web_bytes,created_at) VALUES(?,?,?,?,?,?,?)').run(id,JSON.stringify(item),Buffer.from(data),converted.data,data.length,converted.data.length,item.createdAt);return item});
 const root=mediaRoot();await mkdir(join(root,'masters'),{recursive:true,mode:0o700});
 // Content-addressed masters are retained; removing a product photo only unlinks it.
 try{await writeFile(join(root,'masters',id),data,{flag:'wx',mode:0o600})}catch(e){if((e as NodeJS.ErrnoException).code!=='EEXIST')throw e}
 try{await writeFile(join(root,id+'.webp'),converted.data,{flag:'wx',mode:0o600});await writeFile(join(root,id+'.json'),JSON.stringify(item),{flag:'wx',mode:0o600})}catch(e){if((e as NodeJS.ErrnoException).code!=='EEXIST')throw e}
 return item;
}
export async function readWebImage(id:string){if(!/^[a-f0-9]{64}$/.test(id))return null;if(mediaDriver()==='database'){const row=await db().prepare('SELECT web FROM media_assets WHERE id=?').get(id);return row?new Uint8Array(row.web as Uint8Array):null}try{return new Uint8Array(await readFile(join(mediaRoot(),id+'.webp')))}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return null;throw e}}
export async function uploadedMedia():Promise<MediaItem[]>{if(mediaDriver()==='database')return (await db().prepare('SELECT metadata FROM media_assets ORDER BY created_at DESC').all()).map(r=>JSON.parse(String(r.metadata)) as MediaItem);let files:string[];try{files=await readdir(mediaRoot())}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return [];throw e}return (await Promise.all(files.filter(f=>/^[a-f0-9]{64}\.json$/.test(f)).map(async f=>JSON.parse(await readFile(join(mediaRoot(),f),'utf8')) as MediaItem))).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))}
const staticImages=new Set<string>(staticProductMedia);
export async function validProductImages(images:string[]){
 if(new Set(images).size!==images.length)throw new HttpError(400,'Remove duplicate photo selections.');
 for(const url of images){
  // Vercel serves static files from its CDN; they need not exist in a Function's filesystem.
  if(staticImages.has(url))continue;
  if(/^\/api\/media\/[a-f0-9]{64}\.webp$/.test(url)){
   if(await readWebImage(url.split('/').pop()!.replace('.webp','')))continue;
   throw new HttpError(400,'An uploaded photo is missing from media storage. Remove that photo or upload it again; your other changes are retained in this editor.');
  }
  throw new HttpError(400,'This photo is not in the deployed image library. Choose an existing library photo or upload it again.');
 }
}
