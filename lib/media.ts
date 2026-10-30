import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import sharp from 'sharp';
import {HttpError} from './security';
export const mediaRoot=()=>resolve(process.env.MEDIA_PATH||'data/uploads');
export type MediaItem={id:string;url:string;name:string;width:number;height:number;bytes:number;createdAt:string};
export async function storeImage(data:Uint8Array,name:string):Promise<MediaItem>{
 if(!data.length||data.length>16*1024*1024)throw new HttpError(413,'Use a JPEG, PNG or WebP image up to 16 MB.');
 const image=sharp(data,{limitInputPixels:50000000,animated:false,failOn:'warning'});let meta;try{meta=await image.metadata()}catch{throw new HttpError(400,'This image cannot be read. Use a JPEG, PNG or WebP file.')}
 if(!['jpeg','png','webp'].includes(meta.format||'')||(meta.pages||1)>1)throw new HttpError(400,'Only still JPEG, PNG and WebP images are accepted.');
 const id=createHash('sha256').update(data).digest('hex'),root=mediaRoot();await mkdir(join(root,'masters'),{recursive:true,mode:0o700});
 const converted=await image.rotate().resize({width:2400,height:2400,fit:'inside',withoutEnlargement:true}).webp(meta.format==='png'?{lossless:true}:{quality:94,effort:5}).toBuffer({resolveWithObject:true});
 const item:MediaItem={id,url:'/api/media/'+id+'.webp',name:name.replace(/[\u0000-\u001f/\\]/g,'').slice(0,180)||'Product photo',width:converted.info.width,height:converted.info.height,bytes:converted.data.length,createdAt:new Date().toISOString()};
 // Content-addressed masters are retained; removing a product photo only unlinks it.
 try{await writeFile(join(root,'masters',id),data,{flag:'wx',mode:0o600})}catch(e){if((e as NodeJS.ErrnoException).code!=='EEXIST')throw e}
 try{await writeFile(join(root,id+'.webp'),converted.data,{flag:'wx',mode:0o600});await writeFile(join(root,id+'.json'),JSON.stringify(item),{flag:'wx',mode:0o600})}catch(e){if((e as NodeJS.ErrnoException).code!=='EEXIST')throw e}
 return item;
}
export async function uploadedMedia(){let files:string[];try{files=await readdir(mediaRoot())}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return [];throw e}return (await Promise.all(files.filter(f=>/^[a-f0-9]{64}\.json$/.test(f)).map(async f=>JSON.parse(await readFile(join(mediaRoot(),f),'utf8')) as MediaItem))).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))}
export async function validProductImages(images:string[]){if(new Set(images).size!==images.length)throw new HttpError(400,'Remove duplicate photo selections.');for(const url of images){let path:string;if(/^\/products\/web\/[a-zA-Z0-9_-]+\.webp$/.test(url))path=resolve('public'+url);else if(/^\/api\/media\/[a-f0-9]{64}\.webp$/.test(url))path=join(mediaRoot(),url.split('/').pop()!);else throw new HttpError(400,'Choose a photo from the media library.');try{await readFile(path)}catch{throw new HttpError(400,'A selected image is missing. Upload it again.')}}}
