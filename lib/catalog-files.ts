import type {ImportOperation} from './catalog-import-schema';
import {canonicalGtin} from './product-identifiers';
import {editProductSchema,type ProductEdit,updateProduct,productWarnings,createProduct} from './admin-catalog';
import {products,transaction} from './db';
import type {Product} from './types';
import {HttpError} from './security';

import {columns} from './catalog-columns';
export {columns} from './catalog-columns';
type Column=typeof columns[number];
export type FileRow=Partial<Record<Column,string>>;
const productFields=['name','slug','description','category','priceCents','approved','active'] as const;
const contentFields=['composition','care','fit','details'] as const;
const tradeFields=['officialName','originCountry','hsCode','cnCode','customsDescription','weightGrams','packageLengthCm','packageWidthCm','packageHeightCm','seoTitle','seoDescription'] as const;
const numericTrade=new Set(['weightGrams','packageLengthCm','packageWidthCm','packageHeightCm']);
function integer(value:string,label:string){if(!/^\d+$/.test(value))throw new HttpError(400,label+' must be a non-negative whole number.');return Number(value)}
function bool(value:string,label:string){if(!['true','false'].includes(value))throw new HttpError(400,label+' must be true or false.');return value==='true'}
export function exportRows(catalog:Product[]):FileRow[]{return catalog.flatMap(p=>p.variants.map(v=>{const t=p.content?.trade,i=t?.identifiers?.[v.id];return {productCode:p.code.match(/\d{8}$/)?.[0]||p.code,productId:p.id,version:String(p.version),variantId:v.id,gtin:i?.gtin||'',sku:i?.sku||'',verified:String(!!i?.verified),size:v.size,colour:i?.colour??t?.colour??'',supplierArticle:i?.supplierArticle??t?.supplierArticle??'',archived:String(!!i?.archived),name:p.name,officialName:t?.officialName||'',slug:p.slug,description:p.description,category:p.category,composition:p.content?.composition||'',care:p.content?.care||'',fit:p.content?.fit||'',details:p.content?.details||'',originCountry:t?.originCountry||'',hsCode:t?.hsCode||'',cnCode:t?.cnCode||'',customsDescription:t?.customsDescription||'',weightGrams:t?.weightGrams?.toString()||'',packageLengthCm:t?.packageLengthCm?.toString()||'',packageWidthCm:t?.packageWidthCm?.toString()||'',packageHeightCm:t?.packageHeightCm?.toString()||'',seoTitle:t?.seoTitle||'',seoDescription:t?.seoDescription||'',priceCents:p.priceCents?.toString()||'',stock:String(v.stock),approved:String(p.approved),active:String(p.active),images:JSON.stringify(p.images)}}))}
const safeCell=(value:string)=>/^[\s]*[=+@-]/.test(value)?"'"+value:value;
export function writeCsv(rows:FileRow[]){return '\uFEFF'+[columns.join(','),...rows.map(row=>columns.map(key=>'"'+safeCell(row[key]||'').replaceAll('"','""')+'"').join(','))].join('\r\n')}
export function readCsv(text:string):FileRow[]{return rowsToRecords(readCsvMatrix(text))}
export function readCsvMatrix(text:string):string[][]{
 const rows:string[][]=[];let row:string[]=[],field='',quoted=false;
 text=text.replace(/^\uFEFF/,'');const delimiter=text.split(/\r?\n/,1)[0].includes(';')?';':',';
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++}else if(quoted)quoted=false;else if(field==='')quoted=true;else throw new HttpError(400,'Malformed CSV quote.')}else if(!quoted&&(c===delimiter||c==='\n'||c==='\r')){row.push(field);field='';if(c!==delimiter){if(c==='\r'&&text[i+1]==='\n')i++;if(row.some(Boolean))rows.push(row);row=[]}}else field+=c}
 if(quoted)throw new HttpError(400,'Unclosed CSV quote.');if(field||row.length){row.push(field);rows.push(row)}if(rows.length>2001||rows.some(row=>row.length>128))throw new HttpError(400,'Use at most 2,000 variant rows and 128 columns.');return rows;
}
export function rowsToRecords(rows:string[][]):FileRow[]{const header=rows.shift();if(!header||!header.length||header.some(h=>!columns.includes(h as Column))||new Set(header).size!==header.length)throw new HttpError(400,'Use the export template column names; duplicate or unknown columns are not accepted.');if(rows.length>2000)throw new HttpError(400,'Import at most 2,000 variant rows at once.');return rows.filter(row=>row.some(Boolean)).map((row,index)=>{if(row.length!==header.length)throw new HttpError(400,'Column count differs on row '+(index+2)+'.');return Object.fromEntries(header.map((h,i)=>[h,row[i].replace(/^'(?=\s*[=+@-])/,'')]))})}
export function editFromProduct(p:Product):ProductEdit{return {inventoryBaseline:Object.fromEntries(p.variants.map(v=>[v.id,{stock:v.stock,reserved:v.reserved}])),id:p.id,version:p.version,name:p.name,slug:p.slug,description:p.description,category:p.category as ProductEdit['category'],priceCents:p.priceCents,approved:p.approved,active:p.active,images:p.images,tags:p.tags,featured:p.featured,content:structuredClone(p.content||{composition:'',care:'',fit:'',details:''}),variants:p.variants.map(v=>({id:v.id,size:v.size,stock:v.stock}))}}
export async function importPlan(rows:FileRow[]):Promise<ProductEdit[]>{const catalog=await products(),edits=new Map<string,ProductEdit>(),seenVariants=new Set<string>(),shared=new Map<string,string>();
 if(!rows.length)throw new HttpError(400,'No variant rows found.');
 for(const [index,row] of rows.entries()){
  let p=row.productId?catalog.find(p=>p.id===row.productId):undefined;
  if(row.productId&&!p)throw new HttpError(400,'Unknown productId on row '+(index+2)+'.');
  if(!p&&row.variantId)p=catalog.find(p=>p.variants.some(v=>v.id===row.variantId));
  if(!p&&!row.variantId&&row.gtin)p=catalog.find(p=>Object.values(p.content?.trade?.identifiers||{}).some(id=>id.gtin&&canonicalGtin(id.gtin)===canonicalGtin(row.gtin!)));
  if(!p)throw new HttpError(400,'Row '+(index+2)+': unknown product. Create a draft first, then export its template.');
  const known=row.variantId?p.variants.find(v=>v.id===row.variantId):p.variants.find(v=>{const id=p!.content?.trade?.identifiers?.[v.id];return row.gtin&&id?.gtin&&canonicalGtin(id.gtin)===canonicalGtin(row.gtin)});
  if(!known)throw new HttpError(400,'Row '+(index+2)+': variantId or an existing EAN is required. Add new variants in the editor first.');
  if(seenVariants.has(known.id))throw new HttpError(400,'Variant repeated on row '+(index+2)+'.');seenVariants.add(known.id);
  if(row.version!==undefined&&integer(row.version,'Version')!==p.version)throw new HttpError(409,'Export is outdated for '+p.name+'. Refresh before importing.');
  const edit=edits.get(p.id)||editFromProduct(p);edits.set(p.id,edit);const content=edit.content!;content.trade={...content.trade};
  for(const key of [...productFields,...contentFields,...tradeFields,'images'] as const){if(row[key]===undefined)continue;const duplicateKey=p.id+':'+key,value=row[key]!;if(shared.has(duplicateKey)&&shared.get(duplicateKey)!==value)throw new HttpError(400,'Conflicting shared '+key+' values for '+p.name+'.');shared.set(duplicateKey,value)}
  for(const key of productFields){const value=row[key];if(value===undefined)continue;if(key==='priceCents')edit.priceCents=value===''?null:integer(value,key);else if(key==='active'||key==='approved')edit[key]=bool(value,key);else (edit as any)[key]=value}
  for(const key of contentFields)if(row[key]!==undefined)content[key]=row[key]!;
  for(const key of tradeFields)if(row[key]!==undefined)(content.trade as any)[key]=numericTrade.has(key)?(row[key]===''?undefined:Number(row[key])):row[key];
  if(row.images!==undefined){try{edit.images=JSON.parse(row.images)}catch{throw new HttpError(400,'Images must contain a JSON array of existing library paths.')}}
  const variant=edit.variants.find(v=>v.id===known.id)!;if(row.size!==undefined)variant.size=row.size;if(row.stock!==undefined)variant.stock=integer(row.stock,'Stock');
  const identifier={sku:'',gtin:'',...content.trade.identifiers?.[known.id]};for(const key of ['sku','gtin','colour','supplierArticle'] as const)if(row[key]!==undefined)identifier[key]=row[key]!;
  for(const key of ['verified','archived'] as const)if(row[key]!==undefined)identifier[key]=bool(row[key]!,key);
  content.trade.identifiers={...content.trade.identifiers,[known.id]:identifier};
 }
 return [...edits.values()].map(edit=>{const parsed=editProductSchema.safeParse(edit);if(!parsed.success)throw new HttpError(400,'Invalid import values: '+parsed.error.issues[0].message);return parsed.data});
}
class PreviewRollback extends Error{constructor(public result:unknown){super('Rollback preview')}}
export async function applyProductBatch(edits:ImportOperation[],dryRun:boolean){if(!edits.length||edits.length>100||new Set(edits.map(e=>e.id)).size!==edits.length)throw new HttpError(400,'Choose 1–100 different products.');
 try{return await transaction(async()=>{const before=await products();for(const operation of edits){
 const {createCode,...edit}=operation;
 if(createCode){const first=edit.variants[0];if(!first.size)throw new HttpError(400,'A new product requires a size.');const content=structuredClone(edit.content||{composition:'',care:'',fit:'',details:''});if(content.trade)delete content.trade.identifiers;
 await createProduct({name:edit.name||'',code:createCode,description:edit.description||'',category:edit.category||'Other',priceCents:edit.priceCents,images:edit.images||[],tags:edit.tags||[],featured:edit.featured||false,content,sizes:[first.size]},{id:edit.id,slug:edit.slug||'',variantId:first.id});
 }
 await updateProduct(edit);
 }const after=await products();const result={count:edits.length,changes:edits.map(edit=>{const p=after.find(p=>p.id===edit.id)!;return {id:p.id,before:before.find(x=>x.id===p.id),action:before.some(x=>x.id===p.id)?'update':'create',after:p,warnings:productWarnings(p)}})};if(dryRun)throw new PreviewRollback(result);return result})}catch(e){if(e instanceof PreviewRollback)return e.result;throw e}
}
