import {z} from 'zod';
import {db,products,transaction} from './db';
import {revision} from './admin-catalog';
import {parentId,sharedProducts} from './product-groups';
import {requireFeature,shopFeatures} from './shop-features';
import {validProductImages} from './media';
import {HttpError} from './security';
import {operationAudit,ownerActor} from './operations-audit';
import {productTranslationSchema} from './i18n/product-translation-schema';
import {sourceHashes,publicationStatus,reviewableCopy} from './i18n/published-product-translations';
import {siteLocales} from './i18n/site-routing';
export const reviewLocale=z.enum(['nl','fr','de','it','es']);
export const reviewWriteSchema=z.object({id:z.string().min(1).max(100),version:z.number().int().min(0),locale:reviewLocale,action:z.enum(['approve','withdraw'])}).strict();
export async function translationReviewState(id:string,locale:z.infer<typeof reviewLocale>){const [catalog,flags]=await Promise.all([products(),shopFeatures()]);const p=sharedProducts(catalog).find(p=>p.id===id);if(!p||parentId(p,catalog)!==p.id)throw new HttpError(404,'Choose the shared product.');return {version:p.version,enabled:flags.catalog_translation_drafts,routeActive:(siteLocales as readonly string[]).includes(locale),...publicationStatus(p,locale)};}
export async function reviewProductTranslation(input:z.infer<typeof reviewWriteSchema>){if(input.action==='approve')await requireFeature('catalog_translation_drafts');return transaction(async()=>{
 const catalog=await products(),p=catalog.find(p=>p.id===input.id);if(!p||parentId(p,catalog)!==p.id)throw new HttpError(404,'Choose the shared product.');if(p.version!==input.version)throw new HttpError(409,'The product changed. Reopen the editor before reviewing.');
 const content=structuredClone(p.content||{composition:'',care:'',fit:'',details:''});const publications={...content.translationPublications};
 if(input.action==='approve'){
  const copy=reviewableCopy(productTranslationSchema.parse(content.translations?.[input.locale]||{}));if(!Object.values(copy).some(value=>typeof value==='string'?value.trim():Array.isArray(value)?value.some(v=>v.trim()):value?.enabled&&value.introduction.trim()))throw new HttpError(400,'Save translated text before approving.');
  if(copy.presentation?.enabled)await validProductImages([...new Set(copy.presentation.features.flatMap(f=>[f.image,...(f.logo?[f.logo]:[])]))]);
  const effective=sharedProducts(catalog).find(v=>v.id===p.id)!;publications[input.locale]={copy:structuredClone(copy),sourceHashes:sourceHashes(effective),approvedAt:new Date().toISOString()};
 }else delete publications[input.locale];
 content.translationPublications=publications;
 await db().prepare('INSERT INTO product_content(product_id,content) VALUES(?,?) ON CONFLICT(product_id) DO UPDATE SET content=excluded.content').run(p.id,JSON.stringify(content));
 await db().prepare('UPDATE products SET version=version+1 WHERE id=? AND version=?').run(p.id,p.version);
 await revision({...p,content,version:p.version+1},'Translation '+input.action+': '+input.locale);
 await operationAudit(ownerActor,'translation.'+input.action,p.id,{locale:input.locale,version:p.version+1});return {ok:true,version:p.version+1};
});}
