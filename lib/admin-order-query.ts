import {db} from './db';
import {getOrder} from './commerce';
import type {Order} from './types';
/** Four bounded reads instead of three or more additional queries per order. */
export async function adminOrderBatch(){
 const rows=await db().prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 200').all();if(!rows.length)return [];
 const ids=rows.map(r=>String(r.id)),bound=ids.map(()=>'?').join(',');
 const [lines,withdrawals,reviews]=await Promise.all([
  db().prepare('SELECT order_id,variant_id AS variantId,name,size,quantity,unit_price AS unitPrice FROM order_lines WHERE order_id IN ('+bound+') ORDER BY id').all(...ids),
  db().prepare('SELECT * FROM withdrawal_requests WHERE order_id IN ('+bound+') ORDER BY created_at DESC').all(...ids),
  db().prepare("SELECT entity,action FROM audit WHERE action LIKE 'payment.refund_review.%' AND entity IN ("+bound+') ORDER BY id DESC').all(...ids),
 ]);
 const byOrder=<T extends Record<string,unknown>>(values:T[],key:string)=>{const map=new Map<string,T[]>();for(const value of values){const id=String(value[key]),group=map.get(id)||[];group.push(value);map.set(id,group);}return map;},lineMap=byOrder(lines,'order_id'),withdrawalMap=byOrder(withdrawals,'order_id'),reviewMap=byOrder(reviews,'entity');
 return await Promise.all(rows.map(row=>getOrder(String(row.id),{row,items:(lineMap.get(String(row.id))||[]).map(({order_id,...line})=>line) as unknown as Order['items'],withdrawals:withdrawalMap.get(String(row.id))||[],review:reviewMap.get(String(row.id))?.[0]?.action as string|undefined}))) as Order[];
}
