import {z} from 'zod';
import {products,db,transaction,audit} from './db';
import {updateProduct,createProduct,contentSchema} from './admin-catalog';
import {family,parentId,colourOptions,normalizedSize} from './product-groups';
import {HttpError} from './security';
import {productCategories} from './product-categories';
export const groupEditSchema=z.object({id:z.string().max(100),versions:z.record(z.string(),z.number().int().min(0)),name:z.string().min(2).max(150).refine(value=>!/[\u3400-\u9fff]/u.test(value),'Use a customer-facing product name.'),description:z.string().max(5000).refine(value=>!/[\u3400-\u9fff]/u.test(value),'Use customer-facing text without Chinese characters.'),category:z.enum(productCategories),content:contentSchema}).strict();
export async function saveSharedProduct(data:z.infer<typeof groupEditSchema>){return transaction(async()=>{
 const catalog=await products(),p=catalog.find(p=>p.id===data.id);if(!p||parentId(p,catalog)!==p.id)throw new HttpError(404,'Parent product not found.');
 const members=family(catalog,p);if(members.some(member=>data.versions[member.id]!==member.version)||Object.keys(data.versions).length!==members.length)throw new HttpError(409,'This product group changed in another session. Refresh before saving shared content.');
 const incoming=data.content;
 // Colour/inventory metadata belongs to the original record and is never changed by shared editing.
 const content={...p.content,composition:incoming.composition,care:incoming.care,fit:incoming.fit,details:incoming.details,presentation:incoming.presentation,translations:{...incoming.translations,en:{...incoming.translations?.en,description:data.description,composition:incoming.composition,fit:incoming.fit,details:incoming.details,seoTitle:incoming.trade?.seoTitle,seoDescription:incoming.trade?.seoDescription}},trade:{...p.content?.trade,seoTitle:incoming.trade?.seoTitle,seoDescription:incoming.trade?.seoDescription}};
 return updateProduct({id:p.id,version:p.version,name:data.name,description:data.description,category:data.category,content,priceCents:p.priceCents,approved:p.approved,active:p.active,variants:p.variants.map(v=>({id:v.id,size:v.size,stock:v.stock}))});
})}
export const newColourSchema=z.object({parentId:z.string().max(100),version:z.number().int().min(0),colour:z.string().trim().min(1).max(80).refine(value=>!/[\u3400-\u9fff]/u.test(value),'Use a customer-facing colour name.'),article:z.string().max(100),sizes:z.array(z.string().trim().min(1).max(15)).min(1).max(100),images:z.array(z.string().max(250)).max(30),priceCents:z.number().int().min(1).max(1000000).nullable()}).strict();
export async function addProductColour(data:z.infer<typeof newColourSchema>){return transaction(async()=>{
 const catalog=await products(),p=catalog.find(p=>p.id===data.parentId);if(!p||parentId(p,catalog)!==p.id)throw new HttpError(404,'Parent product not found.');if(p.version!==data.version)throw new HttpError(409,'This product changed. Refresh before adding a colour.');
 if(p.id==='P001'&&data.sizes.some(size=>normalizedSize(size)==='XS'))throw new HttpError(400,'Alpin Fleece uses S–XXXL; XS is not a confirmed sellable size.');
 if(new Set(data.sizes.map(normalizedSize)).size!==data.sizes.length)throw new HttpError(400,'Sizes must be unique.');
 if(colourOptions(catalog,p,true).some(option=>option.colour.toLowerCase()===data.colour.toLowerCase()))throw new HttpError(409,'This colour already exists. Edit its sizes or unarchive it instead.');
 // Every newly added colour has its own draft record, including additions to legacy multi-colour products.
 // This keeps unreviewed images, price and publication status out of an already-published parent.
 if(!/^\d{8}$/.test(data.article))throw new HttpError(400,'Supplier article must contain eight digits for a new colour record.');
 const id=await createProduct({name:p.name,description:p.description,category:z.enum(productCategories).parse(p.category),code:data.article,priceCents:data.priceCents,images:data.images,sizes:data.sizes,tags:[],featured:false,content:{composition:'',care:'',fit:'',details:'',trade:{parentProductId:p.id,colour:data.colour,supplierArticle:data.article,originCountry:p.content?.trade?.originCountry||''}}});
 await audit('catalog.colour.created',p.id+':'+id);return id;
})}
export const archiveColourSchema=z.object({parentId:z.string().max(100),colourId:z.string().max(220),version:z.number().int().min(0),archived:z.boolean()}).strict();
export async function archiveProductColour(data:z.infer<typeof archiveColourSchema>){return transaction(async()=>{
 const catalog=await products(),parent=catalog.find(p=>p.id===data.parentId);if(!parent)throw new HttpError(404,'Parent product not found.');const option=colourOptions(catalog,parent,true).find(option=>option.id===data.colourId);if(!option)throw new HttpError(404,'Colour not found.');const p=option.product;if(p.version!==data.version)throw new HttpError(409,'This colour changed. Refresh before archiving.');
 const content=structuredClone(p.content||{composition:'',care:'',fit:'',details:''});const identifiers={...content.trade?.identifiers};
 for(const v of option.variants)identifiers[v.id]={...identifiers[v.id],sku:identifiers[v.id]?.sku||'',gtin:identifiers[v.id]?.gtin||'',archived:data.archived};
 content.trade={...content.trade,identifiers};await updateProduct({id:p.id,version:p.version,content,priceCents:p.priceCents,active:p.active&&Object.values(identifiers).some(identifier=>!identifier.archived),approved:p.approved,variants:p.variants.map(v=>({id:v.id,size:v.size,stock:v.stock}))});return p.id;
})}
