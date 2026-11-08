import {db,transaction} from './db';
import {HttpError} from './security';
import {operationAudit,ownerActor} from './operations-audit';
export const featureNames=['staff_portal','photo_packing_slips','customer_email','invoice_printing','admin_order_batching','catalog_translation_drafts'] as const;
export type ShopFeature=typeof featureNames[number];
export async function shopFeatures():Promise<Record<ShopFeature,boolean>> {
 const rows=await db().prepare('SELECT name,enabled FROM shop_features').all();
 return Object.fromEntries(featureNames.map(name=>[name,rows.some(r=>r.name===name&&Number(r.enabled)===1)])) as Record<ShopFeature,boolean>;
}
export async function requireFeature(name:ShopFeature){if(!(await shopFeatures())[name])throw new HttpError(409,'This feature is switched off in Backoffice → Operations.');}
export async function setFeature(name:ShopFeature,enabled:boolean){return transaction(async()=>{
 await db().prepare('INSERT INTO shop_features(name,enabled,updated_at) VALUES(?,?,?) ON CONFLICT(name) DO UPDATE SET enabled=excluded.enabled,updated_at=excluded.updated_at').run(name,enabled?1:0,new Date().toISOString());
 await operationAudit(ownerActor,'feature.changed',name,{enabled});
});}
