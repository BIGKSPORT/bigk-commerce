import {requireAdmin,checkOrigin,rateLimit,failure,HttpError} from '@/lib/security';
import {storeImage,uploadedMedia,mediaUploadLimit} from '@/lib/media';
import {products,audit} from '@/lib/db';
export const runtime='nodejs';
export async function GET(req:Request){try{await requireAdmin(req);const catalog=await products(),existing=[...new Set(catalog.flatMap(p=>p.images))].map(url=>({url,name:catalog.find(p=>p.images.includes(url))?.name||'Product image'}));return Response.json({uploaded:await uploadedMedia(),existing},{headers:{'Cache-Control':'no-store'}})}catch(e){return failure(e)}}
export async function POST(req:Request){try{checkOrigin(req);await requireAdmin(req);await rateLimit('admin-media',120,300);
 // Bound the stream before multipart parsing; Content-Length alone is untrusted.
 const reader=req.body?.getReader();if(!reader)throw new HttpError(400,'Choose an image.');const chunks:Uint8Array[]=[];let size=0;for(;;){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>mediaUploadLimit()+256*1024){await reader.cancel();throw new HttpError(413,'The image exceeds the configured upload allowance.')}chunks.push(part.value)}
 const parsed=await new Request(req.url,{method:'POST',headers:{'Content-Type':req.headers.get('content-type')||''},body:Buffer.concat(chunks)}).formData();const file=parsed.get('file');if(!(file instanceof File)||parsed.getAll('file').length!==1)throw new HttpError(400,'Upload one JPEG, PNG or WebP image.');const item=await storeImage(new Uint8Array(await file.arrayBuffer()),file.name);await audit('media.uploaded',item.id);return Response.json(item,{headers:{'Cache-Control':'no-store'}})
}catch(e){return failure(e)}}
