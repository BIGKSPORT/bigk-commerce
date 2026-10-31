import {z} from 'zod';
import {tradeSchema,canonicalGtin} from './product-identifiers';
import {aliasTarget} from './catalog-view';
import {db,products,transaction,audit} from './db';
import {HttpError} from './security';
import {validProductImages} from './media';
import type {Product} from './types';

export const contentSchema=z.object({trade:tradeSchema.optional(),composition:z.string().max(2000),care:z.string().max(2000),fit:z.string().max(2000),details:z.string().max(5000)}).strict();
const textFields={name:z.string().trim().min(2).max(150),description:z.string().trim().max(5000),category:z.enum(['Jackets & Vests','Pants','Accessories','Other']),images:z.array(z.string().max(250)).max(30),tags:z.array(z.string().trim().min(1).max(50)).max(20),featured:z.boolean(),content:contentSchema};
export const editProductSchema=z.object({inventoryBaseline:z.record(z.string(),z.object({stock:z.number().int().min(0),reserved:z.number().int().min(0)}).strict()).optional(),version:z.number().int().min(0),id:z.string().max(100),slug:z.string().min(1).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),priceCents:z.number().int().min(1).max(1000000).nullable(),approved:z.boolean(),active:z.boolean(),variants:z.array(z.object({id:z.string().min(1).max(100),size:z.string().trim().min(1).max(15).optional(),stock:z.number().int().min(0).max(100000)}).strict()).min(1).max(100),name:textFields.name.optional(),description:textFields.description.optional(),category:textFields.category.optional(),images:textFields.images.optional(),tags:textFields.tags.optional(),featured:textFields.featured.optional(),content:textFields.content.optional()}).strict();
export type ProductEdit=z.infer<typeof editProductSchema>;
const normalSize=(value:string)=>value.toUpperCase().replace(/^XXXL$/,'3XL').replace(/^XXL$/,'2XL');
export function productWarnings(p:Product){const warnings:string[]=[];
 if(!p.images.length)warnings.push('No product images.');if(!p.priceCents)warnings.push('Price is missing.');
 if(!p.content?.composition)warnings.push('Composition is missing.');if(!p.content?.trade?.hsCode)warnings.push('HS classification is missing.');
 for(const v of p.variants){const id=p.content?.trade?.identifiers?.[v.id];if(!id?.archived&&!id?.gtin)warnings.push(v.size+': EAN / GTIN is missing.');}
 return warnings;
}
async function revision(p:Product,action:string){await db().prepare('INSERT OR IGNORE INTO product_revisions(id,product_id,version,snapshot,action,actor,created_at) VALUES(?,?,?,?,?,?,?)').run(p.id+':'+p.version,p.id,p.version,JSON.stringify(p),action,'Store administrator',new Date().toISOString());}
export async function productHistory(id:string){return (await db().prepare('SELECT id,version,snapshot,action,actor,created_at FROM product_revisions WHERE product_id=? ORDER BY version DESC').all(id)).map(r=>({...r,snapshot:JSON.parse(String(r.snapshot)) as Product}));}
export async function updateProduct(data:ProductEdit){if(data.images)await validProductImages(data.images);return transaction(async()=>{
 const catalog=await products(),p=catalog.find(p=>p.id===data.id);if(!p)throw new HttpError(404,'Product not found.');
 if(aliasTarget(p))throw new HttpError(409,'Edit the canonical product instead of this legacy record.');
 if(p.version!==data.version)throw new HttpError(409,'This product changed in another session. Refresh before saving.');
 if(data.inventoryBaseline&&p.variants.some(v=>{const old=data.inventoryBaseline![v.id];return !old||old.stock!==v.stock||old.reserved!==v.reserved}))throw new HttpError(409,'Inventory changed since these values were loaded. Refresh and review the changes again.');
 const ids=new Set(data.variants.map(v=>v.id));
 if(ids.size!==data.variants.length||p.variants.some(v=>!ids.has(v.id)))throw new HttpError(400,'Retain every existing variant; archive it instead of deleting its history.');
 const content=structuredClone(data.content??p.content??{composition:'',care:'',fit:'',details:''});
 // Redirect history is server-owned; clients cannot redirect another product.
 const slug=data.slug??p.slug,previousSlugs=[...(p.content?.trade?.previousSlugs||[])];
 if(slug!==p.slug){if(previousSlugs.length>=100)throw new HttpError(409,'URL history limit reached.');previousSlugs.push(p.slug)}
 if(catalog.some(other=>other.id!==p.id&&(other.slug===slug||other.content?.trade?.previousSlugs?.includes(slug))))throw new HttpError(409,'This URL is already used by another product.');
 content.trade={...content.trade,previousSlugs:[...new Set(previousSlugs)].filter(s=>s!==slug)};
 const identifiers=content.trade.identifiers||{},gtins=new Set<string>(),skus=new Set<string>(),combinations=new Set<string>();
 if(Object.keys(identifiers).some(id=>!ids.has(id)))throw new HttpError(400,'Identifiers must belong to this product.');
 const others=catalog.filter(other=>other.id!==p.id).flatMap(other=>Object.values(other.content?.trade?.identifiers||{}));
 for(const v of data.variants){
  const current=p.variants.find(x=>x.id===v.id),size=v.size??current?.size;
  if(!size)throw new HttpError(400,'New variants require a size.');
  if(!current&&!/^V-[0-9a-f-]{36}$/.test(v.id))throw new HttpError(400,'Invalid new variant identifier.');
  if(!current&&catalog.some(other=>other.variants.some(x=>x.id===v.id)))throw new HttpError(409,'Variant belongs to another product.');
  if(v.stock<(current?.reserved||0))throw new HttpError(409,'Stock cannot be below reserved units.');
  if(p.code.endsWith('25300801')&&normalSize(size)==='XS')throw new HttpError(400,'Neofit is not made in XS.');
  const value=identifiers[v.id],combo=(value?.colour||content.trade.colour||'').trim().toLowerCase()+'|'+normalSize(size);
  if(!value?.archived){if(combinations.has(combo))throw new HttpError(409,'Two active variants have the same colour and size.');combinations.add(combo)}
  if(value?.gtin){const key=canonicalGtin(value.gtin);if(gtins.has(key)||others.some(other=>other.gtin&&canonicalGtin(other.gtin)===key))throw new HttpError(409,'This GTIN is already assigned to another variant.');gtins.add(key)}
  if(value?.sku){if(skus.has(value.sku)||others.some(other=>other.sku===value.sku))throw new HttpError(409,'This SKU is already assigned to another variant.');skus.add(value.sku)}
 }
 const images=data.images??p.images;
 if(data.active&&(!data.approved||!data.priceCents||!images.length||combinations.size===0))throw new HttpError(409,'Publishing needs approved pricing, photos and at least one active variant.');
 await revision(p,'Before first tracked change');
 for(const v of data.variants){const current=p.variants.find(x=>x.id===v.id);if(current)await db().prepare('UPDATE variants SET size=?,stock=? WHERE id=? AND product_id=?').run(v.size??current.size,v.stock,v.id,p.id);else await db().prepare('INSERT INTO variants(id,product_id,size,stock,reported) VALUES(?,?,?,?,?)').run(v.id,p.id,v.size,v.stock,null)}
 await db().prepare('UPDATE products SET slug=?,name=?,description=?,category=?,images=?,tags=?,featured=?,price_cents=?,approved=?,active=?,version=version+1 WHERE id=?').run(slug,data.name??p.name,data.description??p.description,data.category??p.category,JSON.stringify(images),JSON.stringify(data.tags??p.tags),data.featured===undefined?(p.featured?1:0):(data.featured?1:0),data.priceCents,data.approved?1:0,data.active?1:0,p.id);
 await db().prepare('INSERT INTO product_content(product_id,content) VALUES(?,?) ON CONFLICT(product_id) DO UPDATE SET content=excluded.content').run(p.id,JSON.stringify(content));
 await revision((await products()).find(x=>x.id===p.id)!,'Saved changes');await audit('catalog.updated',p.id);return p.id;
})}
export async function restoreProduct(id:string,version:number,revisionId:string,restoreInventory=false){return transaction(async()=>{
 const current=(await products()).find(p=>p.id===id),row=await db().prepare('SELECT snapshot FROM product_revisions WHERE id=? AND product_id=?').get(revisionId,id);
 if(!current||!row)throw new HttpError(404,'Product revision not found.');const old=JSON.parse(String(row.snapshot)) as Product;
 const content=structuredClone(old.content??{composition:'',care:'',fit:'',details:''});content.trade={...content.trade,identifiers:{...content.trade?.identifiers}};
 const variants=current.variants.map(v=>{const previous=old.variants.find(x=>x.id===v.id);if(!previous)content.trade!.identifiers![v.id]={...current.content?.trade?.identifiers?.[v.id],sku:current.content?.trade?.identifiers?.[v.id]?.sku||'',gtin:current.content?.trade?.identifiers?.[v.id]?.gtin||'',archived:true};return {id:v.id,size:previous?.size??v.size,stock:restoreInventory&&previous?previous.stock:v.stock}});
 await updateProduct(editProductSchema.parse({id,version,name:old.name,slug:old.slug,description:old.description,category:old.category,images:old.images,tags:old.tags,featured:old.featured,priceCents:old.priceCents,approved:old.approved,active:false,variants,content}));await audit('catalog.restored',id);
})}
export const newProductSchema=z.object({...textFields,code:z.string().regex(/^\d{8}$/),priceCents:z.number().int().min(1).max(1000000).nullable(),sizes:z.array(z.string().trim().min(1).max(15)).min(1).max(100)}).strict();
export async function createProduct(data:z.infer<typeof newProductSchema>,allocation?:{id:string;slug:string;variantId:string}){if(Object.keys(data.content.trade?.identifiers||{}).length)throw new HttpError(400,'Create the draft before assigning variant identifiers.');await validProductImages(data.images);return transaction(async()=>{const catalog=await products();if(catalog.some(p=>p.code.match(/\d{8}$/)?.[0]===data.code))throw new HttpError(409,'This product code already exists. Edit the existing product instead.');if(new Set(data.sizes.map(normalSize)).size!==data.sizes.length)throw new HttpError(400,'Sizes must be unique.');if(data.code==='25300801'&&data.sizes.some(s=>normalSize(s)==='XS'))throw new HttpError(400,'Neofit is not made in XS.');const id=allocation?.id||'P-'+crypto.randomUUID().slice(0,12),generatedSlug=data.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'-'+id.toLowerCase(),slug=allocation?.slug||generatedSlug;if(catalog.some(p=>p.id===id||p.slug===slug||p.content?.trade?.previousSlugs?.includes(slug)))throw new HttpError(409,'This product ID or URL already exists.');await db().prepare('INSERT INTO products(id,slug,name,description,code,category,price_cents,approved,active,featured,images,tags) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(id,slug,data.name,data.description,data.code,data.category,data.priceCents,0,0,data.featured?1:0,JSON.stringify(data.images),JSON.stringify(data.tags));for(const size of data.sizes)await db().prepare('INSERT INTO variants(id,product_id,size,stock,reported) VALUES(?,?,?,?,?)').run(allocation?.variantId||'V-'+crypto.randomUUID(),id,size,0,null);await db().prepare('INSERT INTO product_content(product_id,content) VALUES(?,?)').run(id,JSON.stringify({...data.content,trade:{...data.content.trade,originCountry:data.content.trade?.originCountry??'CN',previousSlugs:[]}}));await revision((await products()).find(p=>p.id===id)!,'Created draft');await audit('catalog.created',id);return id})}
