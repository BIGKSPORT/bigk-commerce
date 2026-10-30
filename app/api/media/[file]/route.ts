import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {mediaRoot} from '@/lib/media';
export const runtime='nodejs';
export async function GET(_req:Request,{params}:{params:Promise<{file:string}>}){const {file}=await params;if(!/^[a-f0-9]{64}\.webp$/.test(file))return new Response('Not found',{status:404});try{return new Response(new Uint8Array(await readFile(join(mediaRoot(),file))),{headers:{'Content-Type':'image/webp','Cache-Control':'public,max-age=31536000,immutable','X-Content-Type-Options':'nosniff'}})}catch{return new Response('Not found',{status:404})}}
