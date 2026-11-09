import {z} from 'zod';
import {db as catalogDb,transaction} from './db';
import {operationsDb as db} from './operations-db';
import {productCategories} from './product-categories';
import {defaultCategoryLabels,type CategoryLabels,type CategoryOption} from './category-labels';
import {catalogLocales} from './i18n/catalog-locales';
import {shopFeatures,requireFeature} from './shop-features';
import {HttpError} from './security';
import {operationAudit,ownerActor} from './operations-audit';
export const categoryNameSchema=z.string().trim().min(1).max(80).refine(v=>!/[\u0000-\u001f<>]/.test(v),'Use a plain category name.');
const labelsSchema=z.object(Object.fromEntries(catalogLocales.map(locale=>[locale,z.string().trim().max(80).refine(v=>!/[\u0000-\u001f<>]/.test(v),'Use plain text.').optional()])) as Record<typeof catalogLocales[number],z.ZodOptional<z.ZodString>>).strict();
export const categoryWriteSchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('create'),name:categoryNameSchema,labels:labelsSchema}).strict(),
 z.object({action:z.literal('save'),name:categoryNameSchema,version:z.number().int().min(0),labels:labelsSchema}).strict(),
 z.object({action:z.enum(['archive','restore']),name:categoryNameSchema,version:z.number().int().min(0)}).strict(),
]);
export type CatalogCategory=CategoryOption&{active:boolean;version:number;count:number};
export async function catalogCategories():Promise<CatalogCategory[]>{
 const enabled=(await shopFeatures()).category_management;
 const counts=await catalogDb().prepare('SELECT category,COUNT(*) AS count FROM products GROUP BY category').all();
 if(!enabled)return productCategories.map(name=>({name,labels:defaultCategoryLabels[name]||{en:name},active:true,version:0,count:Number(counts.find(r=>r.category===name)?.count||0)}));
 const rows=await db().prepare('SELECT name,labels,active,version FROM catalog_categories ORDER BY name').all();
 return rows.map(row=>({name:String(row.name),labels:JSON.parse(String(row.labels)) as CategoryLabels,active:Number(row.active)===1,version:Number(row.version),count:Number(counts.find(r=>r.category===row.name)?.count||0)}));
}
/** Called inside the product transaction; never trust the editor or an import. */
export async function validateCategory(name:string,current?:string){
 categoryNameSchema.parse(name);if(name===current)return;
 if(!(await shopFeatures()).category_management){if(!productCategories.some(v=>v===name))throw new HttpError(400,'Choose an existing category.');return;}
 const row=await db().prepare('SELECT active FROM catalog_categories WHERE name=?').get(name);
 if(!row||Number(row.active)!==1)throw new HttpError(400,'Choose an active category from Backoffice → Categories.');
}
export async function writeCategory(data:z.infer<typeof categoryWriteSchema>){await requireFeature('category_management');return transaction(async()=>{
 const existing=await db().prepare('SELECT name,labels,active,version FROM catalog_categories WHERE name=?').get(data.name);
 if(data.action==='create'){
  const duplicate=await db().prepare('SELECT name FROM catalog_categories WHERE LOWER(name)=LOWER(?)').get(data.name);
  if(duplicate)throw new HttpError(409,'This category already exists. Restore it if it was removed.');
  if(Number((await db().prepare('SELECT COUNT(*) AS count FROM catalog_categories').get())?.count)>=200)throw new HttpError(409,'Category limit reached (200).');
  await db().prepare('INSERT INTO catalog_categories(name,labels,active,version) VALUES(?,?,1,0)').run(data.name,JSON.stringify({...data.labels,en:data.labels.en||data.name}));
 }else{
  if(!existing)throw new HttpError(404,'Category not found.');if(Number(existing.version)!==data.version)throw new HttpError(409,'Category changed in another session. Refresh before saving.');
  if(data.action==='archive'){
   const count=Number((await catalogDb().prepare('SELECT COUNT(*) AS count FROM products WHERE category=?').get(data.name))?.count||0);
   if(count)throw new HttpError(409,`${count} product records still use this category. Move them to another category before removing it.`);
  }
  if(data.action==='save')await db().prepare('UPDATE catalog_categories SET labels=?,version=version+1 WHERE name=?').run(JSON.stringify({...data.labels,en:data.labels.en||data.name}),data.name);
  else await db().prepare('UPDATE catalog_categories SET active=?,version=version+1 WHERE name=?').run(data.action==='restore'?1:0,data.name);
 }
 await operationAudit(ownerActor,'category.'+data.action,data.name,{before:existing||null,after:data});
});}
/** One server read per render; public pages never download category-admin code. */
export async function publicCategoryOptions():Promise<CategoryOption[]|undefined>{
 if(!(await shopFeatures()).category_management)return undefined;
 const rows=await db().prepare('SELECT name,labels FROM catalog_categories WHERE active=1 ORDER BY name').all();
 return rows.map(row=>({name:String(row.name),labels:JSON.parse(String(row.labels)) as CategoryLabels}));
}
