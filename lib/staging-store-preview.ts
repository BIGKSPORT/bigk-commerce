import 'server-only';
import {headers} from 'next/headers';
import {requireAdmin,HttpError} from './security';
export async function isStagingStorePreview(){
 if(process.env.DATABASE_SCHEMA!=='bigk_staging'||process.env.VERCEL_ENV==='production')return false;
 try{await requireAdmin(new Request('https://internal.invalid',{headers:await headers()}));return true}catch(e){if(e instanceof HttpError&&e.status===401)return false;throw e}
}
