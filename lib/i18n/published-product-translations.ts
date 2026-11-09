import {createHash} from 'node:crypto';
import {alpinPublicProduct} from '../alpin-fleece';
import {publicProducts} from '../catalog-view';
import {sharedProducts} from '../product-groups';
import {applyProductCopy} from './apply-product-copy';
import {translationFields} from './translation-publication-schema';
import type {Product,ProductTranslation} from '../types';
import type {CatalogLocale} from './catalog-locales';
export function translationSource(product:Product):ProductTranslation{const p=alpinPublicProduct(product);return {description:p.description,details:p.content?.details||'',composition:p.content?.composition||'',fit:p.content?.fit||'',care:p.content?.care||'',seoTitle:p.content?.trade?.seoTitle||'',seoDescription:p.content?.trade?.seoDescription||'',presentation:p.content?.presentation,features:p.content?.presentation?.features.map(f=>f.description),sizingNote:p.content?.presentation?.sizeGuide||''};}
const fingerprint=(value:unknown)=>createHash('sha256').update(JSON.stringify(value??null,(_key,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(key=>[key,v[key]])):v)).digest('hex');
export function reviewableCopy(value?:ProductTranslation):ProductTranslation{const copy=structuredClone(value||{});for(const key of translationFields){const v=copy[key];if(typeof v==='string'){if(!v.trim())delete copy[key];else (copy as Record<string,unknown>)[key]=v.trim();}else if(Array.isArray(v)&&!v.length)delete copy[key];}if(copy.presentation&&!copy.presentation.enabled)delete copy.presentation;return copy;}
export function sourceHashes(product:Product){const source=translationSource(product);return Object.fromEntries(translationFields.map(key=>[key,fingerprint([alpinPublicProduct(product).name,source[key]])])) as Record<typeof translationFields[number],string>;}
export function usableTranslation(product:Product,locale:CatalogLocale):ProductTranslation|undefined{
 if(locale==='en')return;
 const publication=product.content?.translationPublications?.[locale];if(!publication)return;
 const hashes=sourceHashes(product),copy:ProductTranslation={};
 for(const key of translationFields){const value=publication.copy[key];if(value!==undefined&&value!==''&&publication.sourceHashes[key]===hashes[key])(copy as Record<string,unknown>)[key]=value;}
 return Object.keys(copy).length?copy:undefined;
}
/** Drafts, other languages and approval metadata never reach public product payloads. */
export function localizedPublicProducts(raw:Product[],locale:CatalogLocale,enabled:boolean){const source=new Map(sharedProducts(raw).map(p=>[p.id,p]));return publicProducts(raw).map(p=>applyProductCopy(p,enabled?usableTranslation(source.get(p.id)!,locale):undefined));}
export function publicationStatus(product:Product,locale:CatalogLocale){const publication=locale==='en'?undefined:product.content?.translationPublications?.[locale];const hashes=sourceHashes(product);const changedFields=publication?translationFields.filter(key=>publication.copy[key]!==undefined&&publication.sourceHashes[key]!==hashes[key]):[];return {approvedAt:publication?.approvedAt||null,changedFields,draftChanges:!!publication&&fingerprint(reviewableCopy(product.content?.translations?.[locale]))!==fingerprint(publication.copy)};}
