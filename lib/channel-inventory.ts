import {validGtin,canonicalGtin} from './product-identifiers';
import {rawColour,sharedProducts} from './product-groups';
import type {Product} from './types';
import type {ChannelStockRow,ChannelLink,ChannelName} from './channel-types';
export function channelInventory(catalogue:Product[],policies:Record<string,unknown>[],sellerDemand:Map<string,{submitted:number;paid:number}>):ChannelStockRow[]{
 const counts=new Map<string,number>();
 for(const p of catalogue)for(const v of p.variants){const i=p.content?.trade?.identifiers?.[v.id];if(i?.gtin&&validGtin(i.gtin)&&!i.archived){const e=canonicalGtin(i.gtin);counts.set(e,(counts.get(e)||0)+1);}}
 const policyById=new Map(policies.map(p=>[String(p.variant_id),p]));
 return sharedProducts(catalogue).flatMap(p=>p.variants.map(v=>{
  const i=p.content?.trade?.identifiers?.[v.id],ean=i?.gtin||'',canonicalEan=validGtin(ean)?canonicalGtin(ean):'',policy=policyById.get(v.id),buffer=Number(policy?.buffer||0),available=Math.max(0,v.stock-v.reserved),demand=sellerDemand.get(v.id);
  const eanState=i?.archived?'archived':!ean?'missing':!canonicalEan?'invalid':(counts.get(canonicalEan)||0)>1?'duplicate':i?.verified!==true?'unverified':'ready';
  return {variantId:v.id,productId:p.id,name:p.name,article:i?.supplierArticle||p.content?.trade?.supplierArticle||p.code,colour:i?.colour||rawColour(p),size:v.size,sku:i?.sku||'',ean,canonicalEan,eanState,stock:v.stock,reserved:v.reserved,available,buffer,plannedChannelAvailable:Math.max(0,available-buffer),policyVersion:Number(policy?.version||0),stockIssue:v.stock<v.reserved||v.stock<0||v.reserved<0,sellerSubmittedUnits:demand?.submitted||0,sellerPaidUnits:demand?.paid||0} as ChannelStockRow;
 })).sort((a,b)=>a.name.localeCompare(b.name)||a.colour.localeCompare(b.colour)||a.size.localeCompare(b.size));
}
export function channelLink(row:Record<string,unknown>,inventory:ChannelStockRow[]):ChannelLink{
 const variant=inventory.find(v=>v.variantId===row.variant_id),paused=!!Number(row.paused);
 const reason=!variant?'Variant ontbreekt.':variant.canonicalEan!==row.gtin?'EAN is gewijzigd; controleer de koppeling opnieuw.':variant.eanState!=='ready'?'EAN-controle niet gereed: '+variant.eanState:variant.stockIssue?'Voorraad is inconsistent.':paused?'Lokale koppeling gepauzeerd.':'';
 return {id:String(row.id),version:Number(row.version),channel:row.channel as ChannelName,accountKey:String(row.account_key),externalId:String(row.external_id),variantId:String(row.variant_id),ean:String(row.gtin),externalTitle:String(row.external_title),paused,updatedAt:String(row.updated_at),state:!variant||variant.canonicalEan!==row.gtin?'stale':variant.eanState!=='ready'||variant.stockIssue?'blocked':paused?'paused':'ready',reason};
}
