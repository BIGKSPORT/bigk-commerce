import {z} from 'zod';
import {db,transaction} from './db';
import {HttpError} from './security';
import {operationAudit,type OperationActor} from './operations-audit';
export const stockAdjustment=z.object({variantId:z.string().min(1).max(100),stock:z.number().int().min(0).max(100000),previousStock:z.number().int().min(0),previousReserved:z.number().int().min(0),productVersion:z.number().int().min(0),reason:z.string().trim().min(10).max(500)}).strict();
export async function stockPage(query:string,page:number){
 const term='%'+query.toLowerCase().replace(/[\\%_]/g,'\\$&')+'%',where=" WHERE lower(p.name||' '||p.code||' '||v.id||' '||v.size) LIKE ? ESCAPE '\\'";
 const total=await db().prepare('SELECT count(*) AS n FROM variants v JOIN products p ON p.id=v.product_id'+where).get(term);
 const rows=await db().prepare('SELECT v.id,v.size,v.stock,v.reserved,p.id AS product_id,p.name,p.code,p.images,p.version,c.content FROM variants v JOIN products p ON p.id=v.product_id LEFT JOIN product_content c ON c.product_id=p.id'+where+' ORDER BY p.name,p.id,v.rowid LIMIT 25 OFFSET ?').all(term,(page-1)*25);
 return {page,pageSize:25,total:Number(total?.n||0),items:rows.map(r=>{const content=r.content?JSON.parse(String(r.content)):{};const identifier=content.trade?.identifiers?.[String(r.id)];return {variantId:String(r.id),productId:String(r.product_id),name:String(r.name),code:String(r.code),size:String(r.size),stock:Number(r.stock),reserved:Number(r.reserved),version:Number(r.version),image:JSON.parse(String(r.images))[0]||'',sku:identifier?.sku||'',gtin:identifier?.gtin||''};})};
}
export async function adjustStock(input:z.infer<typeof stockAdjustment>,actor:OperationActor){return transaction(async()=>{
 const row=await db().prepare('SELECT v.stock,v.reserved,v.product_id,p.version FROM variants v JOIN products p ON p.id=v.product_id WHERE v.id=?').get(input.variantId);
 if(!row)throw new HttpError(404,'Variant not found.');if(Number(row.stock)!==input.previousStock||Number(row.reserved)!==input.previousReserved||Number(row.version)!==input.productVersion)throw new HttpError(409,'Stock changed since this screen was loaded. Refresh and recount before saving.');
 if(input.stock<Number(row.reserved))throw new HttpError(409,'Physical stock cannot be below reserved stock.');
 await db().prepare('UPDATE variants SET stock=? WHERE id=?').run(input.stock,input.variantId);await db().prepare('UPDATE products SET version=version+1 WHERE id=?').run(row.product_id);
 await operationAudit(actor,'stock.adjusted',input.variantId,{previousStock:input.previousStock,stock:input.stock,reserved:row.reserved,reason:input.reason});return {ok:true};
});}
