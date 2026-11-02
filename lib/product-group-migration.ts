import {createHash} from 'node:crypto';
import type {Product} from './types';
import {reviewedGroups,normalizedSize,sharedFields} from './product-groups';
import standCollar from '../docs/catalog-review/alpin-stand-collar-vest-owner-confirmed.json';
import hood from '../docs/catalog-review/alpin-hood-gillet-owner-confirmed.json';
/** Reviewed development-data migration. No name/prefix-based merging or stock allocation. */
export function groupingPlan(input:Product[]){
 const catalog=structuredClone(input);const updated:Product[]=[];const added:Product[]=[];
 const colours:Record<string,string>={P001:'Black',P002:'Dusty Blue',P003:'Black',P004:'Dusty Blue',P005:'Cream',P006:'Black',P007:'Beige/Black',P008:'Black',P009:'Cream',P012:'Black',P014:'Cream',P015:'Emerald',P016:'Cream',P023:'Black',P024:'Cream',P025:'Emerald'};
 const descriptions:Record<string,string>={P003:'Quarter-zip top in 92% polyamide and 8% elastane.',P006:'Sleeveless fleece vest with a stand collar and full front zip.',P008:'Hooded fleece top with a full front zip.',P012:'Hooded sleeveless fleece gillet with a full front zip.',P015:'Round-neck top in 90% polyester and 10% elastane.',P023:'Fleece scarf in 100% polyester.'};
 for(const group of reviewedGroups){const parent=catalog.find(p=>p.id===group.parent);if(!parent)continue;
  for(const [i,id] of group.members.entries()){const p=catalog.find(p=>p.id===id);if(!p||!p.code.endsWith(group.articles[i]))throw Error('Reviewed article identity changed: '+id);
   const before=JSON.stringify(p);const original=input.find(p=>p.id===id)!;const originalParent=input.find(p=>p.id===group.parent)!;
   p.content={composition:'',care:'',fit:'',details:'',...p.content,trade:{...p.content?.trade,colour:colours[id],supplierArticle:group.articles[i]}};
   if(id!==parent.id){const overrides=new Set(p.content.trade!.sharedOverrides||[]);for(const key of sharedFields){if(['description','category','seo'].includes(key))continue;const child=original.content?.[key as keyof NonNullable<Product['content']>],root=originalParent.content?.[key as keyof NonNullable<Product['content']>];if(child&&JSON.stringify(child)!==JSON.stringify(root))overrides.add(key)}p.content.trade={...p.content.trade,parentProductId:parent.id,sharedOverrides:[...overrides]};}
   if(parent.id==='P006')p.name=standCollar.productName;if(parent.id==='P012')p.name=hood.productName;
   if(id===parent.id&&descriptions[id])p.description=descriptions[id];
   if(JSON.stringify(p)!==before)updated.push(p);
  }
 }
 for(const source of [standCollar,hood])for(const colour of source.colours){
  let p=catalog.find(p=>p.code.endsWith(colour.article)&&!p.tags.some(t=>t.startsWith('alias:')));
  if(!p){if(colour.article!=='25301703')throw Error('Missing existing reviewed article '+colour.article);const parent=catalog.find(p=>p.id==='P012');if(!parent)throw Error('Hooded parent missing');p={...structuredClone(parent),id:'P028',slug:'alpin-hood-gillet-dusty-blue-p028',code:colour.article,name:source.productName,priceCents:source.priceCents,version:0,images:[],active:false,approved:false,featured:false,tags:[],variants:[],content:{composition:'',care:'',fit:'',details:'',trade:{parentProductId:parent.id,colour:colour.colour,supplierArticle:colour.article}}};catalog.push(p);added.push(p);}
  if(p.priceCents!==source.priceCents)throw Error('Reviewed price conflict: '+p.id);
  p.content={composition:'',care:'',fit:'',details:'',...p.content,trade:{...p.content?.trade,identifiers:{...p.content?.trade?.identifiers}}};
  const before=JSON.stringify(p);
  for(const confirmed of colour.variants){let v=p.variants.find(v=>normalizedSize(v.size)===normalizedSize(confirmed.size));if(!v){v={id:'V-'+createHash('sha256').update(colour.article+'|'+confirmed.size).digest('hex').slice(0,32).replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/,'$1-$2-$3-$4-$5'),size:confirmed.size,stock:0,reserved:0,reported:null};p.variants.push(v)}const existing=p.content.trade!.identifiers![v.id];if(existing?.gtin&&existing.gtin!==confirmed.ean)throw Error('Existing EAN conflict '+v.id);p.content.trade!.identifiers![v.id]={...existing,sku:existing?.sku||colour.article+'-'+confirmed.size,gtin:confirmed.ean,verified:true,colour:colour.colour,supplierArticle:colour.article};}
  if(!added.includes(p)&&JSON.stringify(p)!==before&&!updated.includes(p))updated.push(p);
 }
 // Versions are advanced by the persistence layer only. Historical aliases and all existing variants remain intact.
 return {updated,added,catalog};
}
