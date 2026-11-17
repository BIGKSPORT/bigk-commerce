import {z} from 'zod';
import {products,transaction} from './db';
import {channelDb as db} from './channel-db';
import {salesDb} from './sales-db';
import {operationAudit,ownerActor} from './operations-audit';
import {channelNames,type ChannelOverview} from './channel-types';
import {channelInventory,channelLink} from './channel-inventory';
import {canonicalGtin,validGtin} from './product-identifiers';
import {HttpError} from './security';
export function requireChannelsEnabled(){if(process.env.CHANNEL_STOCK_ENABLED!=='true')throw new HttpError(404,'Kanaalvoorraadbeheer is nog niet geactiveerd.');}
export const channelWrite=z.discriminatedUnion('action',[
 z.object({action:z.literal('link'),channel:z.enum(channelNames),accountKey:z.string().trim().regex(/^[a-z0-9][a-z0-9_-]{0,63}$/),externalId:z.string().trim().min(1).max(200),variantId:z.string().min(1).max(100),ean:z.string().trim().refine(validGtin,'Ongeldige EAN / GTIN.'),externalTitle:z.string().trim().max(500),confirmed:z.literal(true)}).strict(),
 z.object({action:z.literal('buffer'),variantId:z.string().min(1).max(100),version:z.number().int().min(0),buffer:z.number().int().min(0).max(100000),reason:z.string().trim().min(10).max(500)}).strict(),
 z.object({action:z.literal('pause'),id:z.string().uuid(),version:z.number().int().positive(),paused:z.boolean()}).strict(),
 z.object({action:z.literal('unlink'),id:z.string().uuid(),version:z.number().int().positive()}).strict()
]);
async function inventory(){
 const [catalogue,policies,orders]=await Promise.all([products(),db().prepare('SELECT * FROM channel_stock_policies').all(),salesDb().prepare("SELECT status,quote FROM seller_orders WHERE status IN ('submitted','paid')").all()]);
 const demand=new Map<string,{submitted:number;paid:number}>();
 for(const order of orders){const q=JSON.parse(String(order.quote));for(const line of q.lines){const d=demand.get(line.id)||{submitted:0,paid:0};if(order.status==='paid')d.paid+=line.quantity;else d.submitted+=line.quantity;demand.set(line.id,d);}}
 return channelInventory(catalogue,policies,demand);
}
export async function channelOverview():Promise<ChannelOverview>{
 const [rows,links]=await Promise.all([inventory(),db().prepare('SELECT * FROM channel_variant_links ORDER BY channel,account_key,external_id').all()]);
 const labels={bol:'bol.com',ankorstore:'Ankorstore',faire:'Faire',amazon:'Amazon'};
 return {rows,links:links.map(l=>channelLink(l,rows)),channels:channelNames.map(name=>({name,label:labels[name],connection:'not_connected',lastSuccessfulSync:null})),summary:{variants:rows.length,missing:rows.filter(v=>v.eanState==='missing').length,invalid:rows.filter(v=>v.eanState==='invalid').length,duplicate:rows.filter(v=>v.eanState==='duplicate').length,unverified:rows.filter(v=>v.eanState==='unverified').length,ready:rows.filter(v=>v.eanState==='ready').length,stockIssues:rows.filter(v=>v.stockIssue).length,sellerSubmittedUnits:rows.reduce((n,v)=>n+v.sellerSubmittedUnits,0),sellerPaidUnits:rows.reduce((n,v)=>n+v.sellerPaidUnits,0)},updatedAt:new Date().toISOString()};
}
export async function writeChannel(data:z.infer<typeof channelWrite>){db();salesDb();return transaction(async()=>{
 if(data.action==='link'){
  const row=(await inventory()).find(v=>v.variantId===data.variantId);if(!row)throw new HttpError(404,'Variant niet gevonden.');
  if(row.eanState!=='ready'||row.stockIssue)throw new HttpError(409,'Controleer eerst de unieke EAN, verificatie en voorraad in Producten.');
  if(row.canonicalEan!==canonicalGtin(data.ean))throw new HttpError(409,'De EAN van het platform hoort niet bij deze maat/kleur.');
  if(await db().prepare('SELECT id FROM channel_variant_links WHERE channel=? AND account_key=? AND (external_id=? OR variant_id=?)').get(data.channel,data.accountKey,data.externalId,data.variantId))throw new HttpError(409,'Dit platformartikel of deze variant is al gekoppeld binnen dit kanaalaccount.');
  const id=crypto.randomUUID();await db().prepare('INSERT INTO channel_variant_links(id,channel,account_key,external_id,variant_id,gtin,external_title,updated_at) VALUES(?,?,?,?,?,?,?,?)').run(id,data.channel,data.accountKey,data.externalId,data.variantId,row.canonicalEan,data.externalTitle,new Date().toISOString());
  await operationAudit(ownerActor,'channel.link.created',id,{...data,ean:row.canonicalEan});return {id};
 }
 if(data.action==='buffer'){
  if(!(await inventory()).some(v=>v.variantId===data.variantId))throw new HttpError(404,'Variant niet gevonden.');
  const current=await db().prepare('SELECT buffer,version FROM channel_stock_policies WHERE variant_id=?').get(data.variantId);if(Number(current?.version||0)!==data.version)throw new HttpError(409,'De buffer is gewijzigd. Vernieuw het overzicht.');
  await db().prepare('INSERT INTO channel_stock_policies(variant_id,buffer,version,updated_at) VALUES(?,?,?,?) ON CONFLICT(variant_id) DO UPDATE SET buffer=excluded.buffer,version=excluded.version,updated_at=excluded.updated_at').run(data.variantId,data.buffer,data.version+1,new Date().toISOString());
  await operationAudit(ownerActor,'channel.buffer.changed',data.variantId,{previousBuffer:Number(current?.buffer||0),buffer:data.buffer,reason:data.reason});return {ok:true};
 }
 const current=await db().prepare('SELECT * FROM channel_variant_links WHERE id=?').get(data.id);if(!current)throw new HttpError(404,'Koppeling niet gevonden.');if(Number(current.version)!==data.version)throw new HttpError(409,'De koppeling is gewijzigd. Vernieuw het overzicht.');
 if(data.action==='pause')await db().prepare('UPDATE channel_variant_links SET paused=?,version=version+1,updated_at=? WHERE id=?').run(data.paused?1:0,new Date().toISOString(),data.id);
 else await db().prepare('DELETE FROM channel_variant_links WHERE id=?').run(data.id);
 await operationAudit(ownerActor,data.action==='pause'?'channel.link.paused':'channel.link.removed',data.id,{previous:current,...data});return {ok:true};
});}
