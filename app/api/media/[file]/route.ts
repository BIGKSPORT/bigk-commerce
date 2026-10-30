import {readWebImage} from '@/lib/media';
export const runtime='nodejs';
export async function GET(_req:Request,{params}:{params:Promise<{file:string}>}){const {file}=await params;if(!/^[a-f0-9]{64}\.webp$/.test(file))return new Response('Not found',{status:404});const bytes=await readWebImage(file.replace('.webp',''));return bytes?new Response(bytes,{headers:{'Content-Type':'image/webp','Cache-Control':'public,max-age=31536000,immutable','X-Content-Type-Options':'nosniff'}}):new Response('Not found',{status:404})}
