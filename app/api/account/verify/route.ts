import {db,transaction} from '@/lib/db';
import {hash,token,sessionCookie,checkOrigin,boundedText,failure,rateLimitVisitor} from '@/lib/security';
const validToken=(value:string)=>/^[A-Za-z0-9_-]{32,128}$/.test(value);
const target=(req:Request,path:string)=>new URL(path,process.env.APP_URL||new URL(req.url).origin);
/** A scanner following a link must never consume it or create a session. */
export async function GET(req:Request){const value=new URL(req.url).searchParams.get('token')||'',url=target(req,validToken(value)?'/account/confirm':'/account');if(validToken(value))url.searchParams.set('token',value);else url.searchParams.set('error','expired');return new Response(null,{status:303,headers:{Location:url.toString(),'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}})}
export async function POST(req:Request){try{
 checkOrigin(req);await rateLimitVisitor(req,'magic-verify',20,60,5000);
 const raw=await boundedText(req,4096),value=(req.headers.get('content-type')||'').startsWith('application/json')?JSON.parse(raw).token:new URLSearchParams(raw).get('token');
 const session=token(),email=typeof value==='string'&&validToken(value)?await transaction(async()=>{
  const row=await db().prepare('SELECT email FROM login_tokens WHERE hash=? AND expires_at>?').get(hash(value),new Date().toISOString());if(!row)return null;
  await db().prepare('DELETE FROM login_tokens WHERE hash=?').run(hash(value));await db().prepare('DELETE FROM customer_sessions WHERE expires_at<?').run(new Date().toISOString());await db().prepare('INSERT INTO customer_sessions VALUES(?,?,?)').run(hash(session),row.email,new Date(Date.now()+7*24*3600000).toISOString());return row.email;
 }):null;
 const url=target(req,'/account');if(!email)url.searchParams.set('error','expired');return new Response(null,{status:303,headers:{Location:url.toString(),...(email?{'Set-Cookie':sessionCookie('bigk_customer',session,7*24*3600)}:{}),'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
}catch(e){return failure(e)}}
