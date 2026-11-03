import {randomBytes} from 'node:crypto';
import {z} from 'zod';
import {db,products} from './db';
import {cookieValue,hash,HttpError} from './security';
const cookieName='bigk_cart',ttl=7*24*60*60;
const input=z.object({items:z.array(z.object({variantId:z.string().min(1).max(100),quantity:z.number().int().min(1).max(5)}).strict()).max(50),stage:z.enum(['bag','checkout'])}).strict();
function token(req:Request){const value=cookieValue(req,cookieName);return /^[a-f0-9]{64}$/.test(value)?value:''}
export async function cleanSavedCarts(){await db().prepare('DELETE FROM cart_sessions WHERE expires_at<?').run(new Date().toISOString())}
export async function getSavedCart(req:Request){const key=token(req);if(!key)return {items:[],hasCart:false};const row=await db().prepare('SELECT c.items,o.status AS order_status FROM cart_sessions c LEFT JOIN orders o ON o.id=c.order_id WHERE c.id=? AND c.expires_at>?').get(hash(key),new Date().toISOString());if(!row)return {items:[],hasCart:false};if(['paid','fulfilled'].includes(String(row.order_status)))return {items:[],hasCart:false};return {items:(JSON.parse(String(row.items)) as {variantId:string;quantity:number}[]).map(({variantId,quantity})=>({variantId,quantity})),hasCart:true}}
export async function saveSavedCart(req:Request,raw:unknown){
 const parsed=input.safeParse(raw);if(!parsed.success)throw new HttpError(400,'Invalid saved cart.');
 if(new Set(parsed.data.items.map(i=>i.variantId)).size!==parsed.data.items.length)throw new HttpError(400,'Duplicate cart item.');
 const catalog=await products();const items=parsed.data.items.map(line=>{const p=catalog.find(p=>p.active&&p.approved&&p.variants.some(v=>v.id===line.variantId));const v=p?.variants.find(v=>v.id===line.variantId);if(!p||!v||p.priceCents===null||p.content?.trade?.identifiers?.[v.id]?.archived)throw new HttpError(409,'A cart item is no longer available.');return {...line,name:p.name,size:v.size,unitPrice:p.priceCents}});
 let key=token(req),existing=key?await db().prepare('SELECT c.id,o.status AS order_status FROM cart_sessions c LEFT JOIN orders o ON o.id=c.order_id WHERE c.id=? AND c.expires_at>?').get(hash(key),new Date().toISOString()):undefined;
 if(existing&&['paid','fulfilled'].includes(String(existing.order_status)))existing=undefined;
 if(!items.length&&!existing)return {items:[],hasCart:false,cookie:null};
 const fresh=!existing;if(fresh)key=randomBytes(32).toString('hex');
 const now=new Date().toISOString(),expires=new Date(Date.now()+ttl*1000).toISOString();
 await cleanSavedCarts();
 await db().prepare('INSERT INTO cart_sessions(id,items,stage,total,created_at,updated_at,expires_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET items=excluded.items,stage=excluded.stage,total=excluded.total,updated_at=excluded.updated_at,expires_at=excluded.expires_at').run(hash(key),JSON.stringify(items),items.length?parsed.data.stage:'cleared',items.reduce((sum,i)=>sum+i.quantity*i.unitPrice,0),now,now,expires);
 return {items:items.map(({variantId,quantity})=>({variantId,quantity})),hasCart:true,cookie:cookieName+'='+key+'; Path=/; HttpOnly; SameSite=Strict; Max-Age='+ttl+(process.env.NODE_ENV==='production'?'; Secure':'')};
}
export async function linkSavedCart(req:Request,orderId:string){const key=token(req);if(key)await db().prepare("UPDATE cart_sessions SET order_id=?,stage='checkout',updated_at=? WHERE id=? AND expires_at>?").run(orderId,new Date().toISOString(),hash(key),new Date().toISOString())}
export async function savedCartOverview(){await cleanSavedCarts();const rows=await db().prepare('SELECT c.id,c.items,c.stage,c.total,c.created_at,c.updated_at,c.order_id,o.status AS order_status FROM cart_sessions c LEFT JOIN orders o ON o.id=c.order_id ORDER BY c.updated_at DESC LIMIT 200').all();return rows.map(row=>{const paid=['paid','fulfilled'].includes(String(row.order_status));const inactive=Date.now()-Date.parse(String(row.updated_at))>=30*60*1000;return {id:String(row.id).slice(0,12),items:JSON.parse(String(row.items)),total:Number(row.total),createdAt:String(row.created_at),updatedAt:String(row.updated_at),orderId:row.order_id?String(row.order_id):null,status:paid?'converted':row.order_id?'unpaid_checkout':row.stage==='cleared'?'cleared':inactive?'possibly_abandoned':row.stage==='checkout'?'checkout_started':'open'}})}
