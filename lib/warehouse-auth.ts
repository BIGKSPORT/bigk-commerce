import {createHmac,randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';
import {db} from './db';
import {cookieValue,HttpError,hash} from './security';
export type WarehouseRole='picker'|'returns'|'lead';
type Account={id:string;name:string;role:WarehouseRole;passwordHash:string};
const roles=new Set<WarehouseRole>(['picker','returns','lead']);
function accounts():Account[]{
 const raw=process.env.WAREHOUSE_ACCOUNTS_JSON;
 if(!raw)return [];
 let value:unknown;
 try{value=JSON.parse(raw)}catch{throw new HttpError(503,'Warehouse accounts are not configured correctly.')}
 if(!Array.isArray(value)||value.length>30)return [];
 const safe:Account[]=[];
 for(const row of value){
  if(!row||typeof row!=='object')return [];
  const r=row as Record<string,unknown>;
  if(typeof r.id!=='string'||!/^[a-z0-9_-]{3,40}$/.test(r.id)||
     typeof r.name!=='string'||r.name.length<1||r.name.length>80||
     !roles.has(r.role as WarehouseRole)||typeof r.passwordHash!=='string'||
     !/^[a-f0-9]{32,128}:[a-f0-9]{128}$/.test(r.passwordHash))return [];
  safe.push({id:r.id,name:r.name,role:r.role as WarehouseRole,passwordHash:r.passwordHash});
 }
 if(new Set(safe.map(a=>a.id)).size!==safe.length)return [];
 return safe;
}
function secret():string{
 const key=process.env.WAREHOUSE_SESSION_SECRET||'';
 if(key.length<48)throw new HttpError(503,'Warehouse login is not configured.');
 return key;
}
function checkPassword(password:string,encoded:string):boolean{
 const [salt,expectedHex]=encoded.split(':');
 const actual=scryptSync(password,salt,64);
 return timingSafeEqual(actual,Buffer.from(expectedHex,'hex'));
}
export function authenticateWarehouse(id:string,password:string){
 if(password.length>256||!/^[a-z0-9_-]{3,40}$/.test(id))return null;
 secret();
 const account=accounts().find(a=>a.id===id);
 if(!account)return null;
 return checkPassword(password,account.passwordHash)
  ?{id:account.id,name:account.name,role:account.role}:null;
}
function signature(payload:string){
 return createHmac('sha256',secret()).update(payload).digest('base64url');
}
export async function createWarehouseSession(id:string){
 const account=accounts().find(a=>a.id===id);
 if(!account)throw new HttpError(403,'Invalid warehouse account.');
 const payload=Buffer.from(JSON.stringify({
  id,issued:Date.now(),credentialVersion:createHmac('sha256',secret()).update(account.passwordHash).digest('hex'),nonce:randomBytes(12).toString('hex')
 })).toString('base64url');
 const value=payload+'.'+signature(payload);
 await db().prepare('INSERT INTO sessions(hash,expires_at) VALUES(?,?)').run(hash('warehouse:'+value),new Date(Date.now()+2*3600000).toISOString());
 return value;
}
export function warehouseCookie(value:string,maxAge:number){
 return `bigk_warehouse=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${process.env.NODE_ENV==='production'?'; Secure':''}`;
}
export async function requireWarehouse(req:Request,roles?:WarehouseRole[]){
 const value=cookieValue(req,'bigk_warehouse');
 const [payload,sig,extra]=value.split('.');
 if(!payload||!sig||extra)throw new HttpError(401,'Warehouse sign-in required.');
 const expected=Buffer.from(signature(payload));
 const provided=Buffer.from(sig);
 if(expected.length!==provided.length||!timingSafeEqual(expected,provided))
  throw new HttpError(401,'Warehouse sign-in required.');
 let data:unknown;
 try{data=JSON.parse(Buffer.from(payload,'base64url').toString('utf8'))}
 catch{throw new HttpError(401,'Warehouse session invalid.')}
 if(!data||typeof data!=='object')throw new HttpError(401,'Warehouse session invalid.');
 const s=data as Record<string,unknown>;
 if(typeof s.id!=='string'||typeof s.issued!=='number'||
   !Number.isFinite(s.issued)||s.issued>Date.now()+30000||
   Date.now()-s.issued>2*3600000)
  throw new HttpError(401,'Warehouse session expired.');
 const account=accounts().find(a=>a.id===s.id);
 if(!account||s.credentialVersion!==createHmac('sha256',secret()).update(account.passwordHash).digest('hex')||!await db().prepare('SELECT hash FROM sessions WHERE hash=? AND expires_at>?').get(hash('warehouse:'+value),new Date().toISOString()))throw new HttpError(401,'Warehouse sign-in required.');
 if(!account||roles&&!roles.includes(account.role))
  throw new HttpError(403,'Warehouse role is not authorised.');
 return {id:account.id,name:account.name,role:account.role};
}

export async function revokeWarehouseSession(req:Request){const value=cookieValue(req,'bigk_warehouse');if(value)await db().prepare('DELETE FROM sessions WHERE hash=?').run(hash('warehouse:'+value))}
