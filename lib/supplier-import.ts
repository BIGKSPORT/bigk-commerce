import {products} from './db';
import {visibleProducts} from './catalog-view';
import {colourLabel} from './product-family';
import {canonicalGtin} from './product-identifiers';
import {editFromProduct,type FileRow} from './catalog-files';
import {importOperationSchema,type ImportOperation} from './catalog-import-schema';
import type {Product} from './types';
import {HttpError} from './security';

import {importTargets,type ImportTarget} from './catalog-columns';
export {importTargets} from './catalog-columns';
export type ImportOptions={allowNewProducts:boolean;allowNewVariants:boolean;skipBlank:boolean;includePublication:boolean};
export const defaultImportOptions:ImportOptions={allowNewProducts:false,allowNewVariants:false,skipBlank:true,includePublication:false};
const normalize=(s:string)=>s.normalize('NFKC').trim().toLowerCase().replace(/[\s_\-.,()/€]+/g,'');
const aliases:Record<string,ImportTarget>={ean:'gtin',ean13:'gtin',barcode:'gtin',barcodes:'gtin',productnaamwebsite:'name',productnaam:'name',productname:'name',naam:'name',maat:'size',size:'size',kleur:'colour',color:'colour',samenstelling:'composition',materiaalsamenstelling:'composition',materialcomposition:'composition',wasvoorschrift:'care',wasvoorschriften:'care',careinstructions:'care',beschrijving:'description',productomschrijving:'description',omschrijvingnl:'description',verkoopprijsinclbtw:'priceEUR',price:'priceEUR',prijs:'priceEUR',retailprice:'priceEUR',bevestigdeontvangenvoorraad:'stock',voorraad:'stock',quantity:'stock',skuinclmaat:'sku',artikelnummer:'supplierArticle',suppliercode:'supplierArticle',landvanherkomst:'originCountry',countryoforigin:'originCountry',hscode:'hsCode',cncode:'cnCode',weightgrams:'weightGrams',gewichtgram:'weightGrams'};
export function suggestMapping(headers:string[]):Record<string,ImportTarget>{const result:Record<string,ImportTarget>={},used=new Set<string>();headers.forEach((header,index)=>{const key=normalize(header),target=importTargets.find(t=>normalize(t)===key)||aliases[key];if(target&&!used.has(target)){result[String(index)]=target;used.add(target)}});return result}
function money(value:string){let text=value.trim().replace(/[€\s]/g,'');if(!/^\d+(?:[.,]\d+)*$/.test(text))throw new HttpError(400,'EUR prices must be amounts such as 146.90 or 146,90.');if(text.includes(',')&&text.includes('.')){const decimal=text.lastIndexOf(',')>text.lastIndexOf('.')?',':'.';text=text.split(decimal==='.'?',':'.').join('').replace(decimal,'.')}else text=text.replace(',','.');if(!/^\d+(?:\.\d{1,2})?$/.test(text))throw new HttpError(400,'EUR prices need at most two decimal places.');const [whole,fraction='']=text.split('.');return String(Number(whole)*100+Number(fraction.padEnd(2,'0')))}
function bool(value:string){const key=value.trim().toLowerCase();if(['true','yes','ja','1'].includes(key))return 'true';if(['false','no','nee','0'].includes(key))return 'false';throw new HttpError(400,'Use yes/no or true/false for boolean fields.')}
export function mappedRows(matrix:string[][],mapping:Record<string,string>,options:ImportOptions):FileRow[]{
 const entries=Object.entries(mapping).filter(([,target])=>target);if(!entries.length)throw new HttpError(400,'Map at least one column.');if(entries.some(([index,target])=>!/^\d+$/.test(index)||!importTargets.includes(target as ImportTarget)))throw new HttpError(400,'Invalid column mapping.');if(new Set(entries.map(([,target])=>target)).size!==entries.length)throw new HttpError(400,'Each destination field can be mapped once.');if(entries.some(([,t])=>t==='priceEUR')&&entries.some(([,t])=>t==='priceCents'))throw new HttpError(400,'Map a price in EUR or cents, not both.');
 return matrix.filter(row=>row.some(cell=>cell.trim())).map(row=>{const record:FileRow={};for(const [index,target] of entries){let value=(row[Number(index)]||'').trim();if(options.skipBlank&&!value)continue;if(!options.includePublication&&['active','approved'].includes(target))continue;if(['verified','archived','active','approved'].includes(target)&&value)value=bool(value);if(target==='originCountry')value=({china:'CN',belgium:'BE',belgië:'BE',belgique:'BE',netherlands:'NL',nederland:'NL',france:'FR',frankrijk:'FR',germany:'DE',duitsland:'DE',portugal:'PT',italy:'IT',italië:'IT',vietnam:'VN',bangladesh:'BD',india:'IN',pakistan:'PK',turkey:'TR',türkiye:'TR',turkije:'TR'} as Record<string,string>)[value.toLowerCase()]||value.toUpperCase();if(target==='priceEUR')record.priceCents=value?money(value):'';else (record as any)[target]=value}return record}).filter(row=>Object.keys(row).length>0);
}
const normalSize=(s:string)=>s.trim().toUpperCase().replace(/^XXXL$/,'3XL').replace(/^XXL$/,'2XL');
const keyColour=(s:string)=>normalize(s);
const codeOf=(p:Product)=>p.code.match(/\d{8}$/)?.[0]||p.code;
const sharedFields=['name','officialName','slug','description','category','composition','care','fit','details','originCountry','hsCode','cnCode','customsDescription','weightGrams','packageLengthCm','packageWidthCm','packageHeightCm','seoTitle','seoDescription','priceCents','approved','active','images'] as const;
const numericFields=new Set(['weightGrams','packageLengthCm','packageWidthCm','packageHeightCm']);
export async function supplierPlan(input:FileRow[],options:ImportOptions,firstDataRow=2):Promise<ImportOperation[]>{
 const catalog=visibleProducts(await products()),plans=new Map<string,ImportOperation>(),shared=new Map<string,string>(),seen=new Set<string>();if(!input.length||input.length>2000)throw new HttpError(400,'Choose 1–2,000 variant rows.');
 for(const [index,source] of input.entries()){
  const row={...source};if(row.productCode==='')delete row.productCode;
  const skuParts=row.sku?.match(/^(\d{8})[-_ ](.{1,15})$/);if(!row.productCode&&skuParts)row.productCode=skuParts[1];if(!row.size&&skuParts)row.size=skuParts[2];
  const byId=row.productId?catalog.find(p=>p.id===row.productId):undefined;
  if(row.productId&&!byId)throw new HttpError(400,'Row '+(index+firstDataRow)+': productId is unknown. Use productCode for a new product.');
  const byVariant=row.variantId?catalog.find(p=>p.variants.some(v=>v.id===row.variantId)):undefined;if(row.variantId&&!byVariant)throw new HttpError(400,'Row '+(index+firstDataRow)+': variantId is unknown. Leave it blank to add a new variant.');
  const matches=catalog.flatMap(p=>p.variants.map(v=>({p,v,id:p.content?.trade?.identifiers?.[v.id]}))).filter(x=>(row.gtin&&x.id?.gtin&&canonicalGtin(x.id.gtin)===canonicalGtin(row.gtin))||(row.sku&&x.id?.sku===row.sku));
  if(matches.length>1&&new Set(matches.map(x=>x.v.id)).size>1)throw new HttpError(409,'Row '+(index+firstDataRow)+': EAN and SKU identify different variants.');
  if(row.variantId&&matches[0]&&matches[0].v.id!==row.variantId)throw new HttpError(409,'Row '+(index+firstDataRow)+': variantId conflicts with the EAN / SKU.');
  const byIdentifier=matches[0]?.p;
  const code=row.productCode||(/^\d{8}$/.test(row.supplierArticle||'')?row.supplierArticle:undefined);
  const codeMatches=code?catalog.filter(p=>codeOf(p)===code):[];if(codeMatches.length>1)throw new HttpError(409,'Row '+(index+firstDataRow)+': product code matches several records. Use productId.');
  const identified=[byId,byVariant,byIdentifier,codeMatches[0]].filter(Boolean) as Product[];
  if(new Set(identified.map(p=>p.id)).size>1)throw new HttpError(409,'Row '+(index+firstDataRow)+': supplied identifiers belong to different products.');
  const p=identified[0];if(p&&row.productCode&&codeOf(p)!==row.productCode)throw new HttpError(409,'Row '+(index+firstDataRow)+': product code conflicts with the identified product.');let plan:ImportOperation;
  const planKey=p?.id||'new:'+code;
  if(p){if(row.version!==undefined&&row.version!==''&&Number(row.version)!==p.version)throw new HttpError(409,'Row '+(index+firstDataRow)+': export is outdated.');plan=plans.get(planKey)||editFromProduct(p)}else{
   if(!options.allowNewProducts)throw new HttpError(400,'Row '+(index+firstDataRow)+': product is unknown. Enable new draft products or correct its identifiers.');
   if(!code||!/^\d{8}$/.test(code))throw new HttpError(400,'Row '+(index+firstDataRow)+': new products need an eight-digit productCode or supplier article number.');
   plan=plans.get(planKey)!;if(!plan){if(!row.name?.trim())throw new HttpError(400,'Row '+(index+firstDataRow)+': a new product needs a name.');const id='P-'+crypto.randomUUID();plan={id,version:0,createCode:code,name:row.name,slug:row.slug||row.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'-'+id.slice(-8),description:'',category:'Other',priceCents:null,approved:false,active:false,images:[],tags:[],featured:false,content:{composition:'',care:'',fit:'',details:'',trade:{originCountry:'CN',identifiers:{}}},variants:[]}}
  }
  plans.set(planKey,plan);const content=plan.content!;content.trade={...content.trade,identifiers:{...content.trade?.identifiers}};
  for(const field of sharedFields){const value=row[field];if(value===undefined)continue;const key=plan.id+':'+field;if(shared.has(key)&&shared.get(key)!==value)throw new HttpError(400,'Row '+(index+firstDataRow)+': conflicting shared '+field+' values.');shared.set(key,value);
   if(field==='active'||field==='approved'){if(!plan.createCode)(plan as any)[field]=value==='true'}else if(['name','slug','description','category'].includes(field))(plan as any)[field]=value;
   else if(field==='priceCents'){if(value!==''&&!/^\d+$/.test(value))throw new HttpError(400,'Prices in cents must be whole numbers.');plan.priceCents=value===''?null:Number(value)}
   else if(['composition','care','fit','details'].includes(field))(content as any)[field]=value;
   else if(field==='images'){try{plan.images=JSON.parse(value)}catch{throw new HttpError(400,'Images must be a JSON list of existing library paths.')}}
   else (content.trade as any)[field]=numericFields.has(field)?(value===''?undefined:Number(value)):value;
  }
  let variant=p?.variants.find(v=>v.id===row.variantId)||matches[0]?.v;
  const size=row.size?.trim();if(!variant&&size){const expectedColour=row.colour||p?.content?.trade?.colour||(p?colourLabel(p):'');const candidates=plan.variants.filter(v=>normalSize(v.size||'')===normalSize(size)&&(!row.colour||keyColour(content.trade!.identifiers?.[v.id]?.colour||p?.content?.trade?.colour||(p?colourLabel(p):''))===keyColour(expectedColour)));if(candidates.length>1)throw new HttpError(409,'Row '+(index+firstDataRow)+': size matches several colours. Supply colour, EAN or variantId.');variant=candidates[0] as any;}
  let target=variant?plan.variants.find(v=>v.id===variant.id):undefined;
  if(!target){if(p&&!options.allowNewVariants)throw new HttpError(400,'Row '+(index+firstDataRow)+': new variant. Enable adding variants or supply its existing EAN / variantId.');if(!size)throw new HttpError(400,'Row '+(index+firstDataRow)+': a new variant needs a size.');target={id:'V-'+crypto.randomUUID(),size,stock:0};plan.variants.push(target)}
  if(seen.has(target.id))throw new HttpError(409,'Row '+(index+firstDataRow)+': this variant occurs more than once.');seen.add(target.id);
  if(size)target.size=size;if(row.stock!==undefined){if(!/^\d+$/.test(row.stock))throw new HttpError(400,'Row '+(index+firstDataRow)+': stock must be a non-negative whole number.');target.stock=Number(row.stock)}
  const identifier={...(content.trade.identifiers![target.id]||{sku:'',gtin:''})};if(row.gtin!==undefined&&row.gtin!==identifier.gtin&&row.verified===undefined)identifier.verified=false;for(const field of ['sku','gtin','colour','supplierArticle'] as const)if(row[field]!==undefined)identifier[field]=row[field]!;for(const field of ['archived','verified'] as const)if(row[field]!==undefined)identifier[field]=row[field]==='true';content.trade.identifiers![target.id]=identifier;
 }
 if(plans.size>100)throw new HttpError(400,'Import at most 100 products at a time.');return [...plans.values()].map(plan=>{const parsed=importOperationSchema.safeParse(plan);if(!parsed.success)throw new HttpError(400,(plan.name||plan.id)+': '+parsed.error.issues[0].message);return parsed.data});
}
