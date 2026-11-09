import {z} from 'zod';
import {db,products,transaction} from './db';
import {family,parentId} from './product-groups';
import {categoryNameSchema,validateCategory} from './catalog-categories';
import {requireFeature} from './shop-features';
import {revision} from './admin-catalog';
import {operationAudit,ownerActor} from './operations-audit';
import {HttpError} from './security';
export const moveCategorySchema=z.object({id:z.string().min(1).max(100),category:categoryNameSchema,versions:z.record(z.string(),z.number().int().min(0)),dryRun:z.boolean()}).strict();
/** A category move must never replay client prices, content or inventory values. */
export async function moveProductCategory(input:z.infer<typeof moveCategorySchema>){await requireFeature('category_management');return transaction(async()=>{
 const catalog=await products(),root=catalog.find(p=>p.id===input.id&&!p.tags.some(t=>t.startsWith('alias:')));
 if(!root||parentId(root,catalog)!==root.id)throw new HttpError(404,'Choose a product style.');
 await validateCategory(input.category);
 const members=family(catalog,root);
 if(Object.keys(input.versions).length!==members.length||members.some(p=>input.versions[p.id]!==p.version))throw new HttpError(409,'This style changed. Refresh the product list and review again.');
 const change={id:root.id,name:root.name,category:input.category,records:members.map(p=>({id:p.id,from:p.category,to:input.category})),variants:members.reduce((n,p)=>n+p.variants.length,0)};
 if(input.dryRun)return {dryRun:true,change};
 for(const p of members){
  await db().prepare('UPDATE products SET category=?,version=version+1 WHERE id=? AND version=?').run(input.category,p.id,p.version);
  const content=structuredClone(p.content);
  if(content?.trade?.sharedOverrides?.includes('category')){content.trade.sharedOverrides=content.trade.sharedOverrides.filter(field=>field!=='category');await db().prepare('UPDATE product_content SET content=? WHERE product_id=?').run(JSON.stringify(content),p.id);}
  await revision({...p,category:input.category,version:p.version+1,content},'Moved style to category: '+input.category);
 }
 await operationAudit(ownerActor,'category.move-style',root.id,change);
 return {dryRun:false,change};
});}
