import {careCopy,careSymbols} from './i18n/care';
import type {Product} from './types';
import type {Locale} from './i18n/config';
import copy from './i18n/alpin-fleece.json';
import {hasAlpinTechnology} from './alpin-technology';
import {validGtin} from './product-identifiers';
export const alpinLocales = ['en', 'nl', 'fr'] as const;
export type AlpinLocale = typeof alpinLocales[number];
export function isAlpinLocale(value: string): value is AlpinLocale {return alpinLocales.some(locale => locale === value)}
export const alpinPaths: Record<AlpinLocale,string> = {
  en:'/en/products/alpin-fleece-jacket', nl:'/nl/products/alpin-fleecejas', fr:'/fr/products/veste-polaire-alpin',
};
export const alpinName = 'Alpin Fleece';
export const alpinGroupId = 'ALPIN-FLEECE';
export const alpinSizes = ['S','M','L','XL','XXL','XXXL'] as const;
export function alpinSize(value:string){return value==='2XL'?'XXL':value==='3XL'?'XXXL':value}
const gtins = {
  '25303101':['6957919564755','6957919564762','6957919564779','6957919564786','6957919564793','6957919564809'],
  '25303102':['6957919564823','6957919564830','6957919564847','6957919564854','6957919564861','6957919564878'],
} as const;
export function alpinArticle(product:Pick<Product,'code'>){return product.code.endsWith('25303101')?'25303101':product.code.endsWith('25303102')?'25303102':undefined}
export function alpinColour(article:string,locale:Locale='en') {
  const black=article==='25303101';
  return locale==='nl'?(black?'Zwart':'Vergrijsd blauw'):locale==='fr'?(black?'Noir':'Bleu grisé'):black?'Black':'Dusty Blue';
}
export function alpinVariantMapping(product:Product) {
  if(!hasAlpinTechnology(product))return [];
  const article=alpinArticle(product)!;
  return product.variants.filter(v=>alpinSizes.includes(alpinSize(v.size) as typeof alpinSizes[number])&&!product.content?.trade?.identifiers?.[v.id]?.archived).map(v=>{
    const size=alpinSize(v.size),index=alpinSizes.indexOf(size as typeof alpinSizes[number]),existing=product.content?.trade?.identifiers?.[v.id];
    const gtin=gtins[article][index];
    return {id:v.id,size,article,colour:alpinColour(article),gtin,sku:existing?.sku||article+'-'+v.size,stock:v.stock,reserved:v.reserved,conflict:Boolean(existing?.gtin&&existing.gtin!==gtin)};
  });
}
export function alpinMappingIssues(products:Product[]) {
  const family=products.filter(hasAlpinTechnology),mapping=family.flatMap(alpinVariantMapping),issues:string[]=[];
  if(family.length!==2)issues.push('Both ALPIN fleece article records are required.');
  for(const article of Object.keys(gtins))for(const size of alpinSizes)if(mapping.filter(v=>v.article===article&&v.size===size).length!==1)issues.push(`Expected one ${article} ${size} variant.`);
  if(mapping.length!==12)issues.push('Expected exactly twelve sellable variants.');
  for(const v of mapping){if(v.conflict)issues.push(`Conflicting stored GTIN for ${v.id}.`);if(!validGtin(v.gtin))issues.push(`Invalid GTIN for ${v.id}.`)}
  if(new Set(mapping.map(v=>v.sku)).size!==mapping.length)issues.push('Size-level SKUs must be unique.');
  for(const p of family)if(p.priceCents!==14690)issues.push(`Price conflict for ${p.id}: stored ${p.priceCents}; owner supplied 14690 cents.`);
  return issues;
}
/** Exact owner-approved name, prose and mappings. Prices and inventory remain database values. */
export function alpinPublicProduct(product:Product):Product {
  if(!hasAlpinTechnology(product))return product;
  const mapping=alpinVariantMapping(product),identifiers={...product.content?.trade?.identifiers};
  for(const v of mapping){const current=identifiers[v.id];identifiers[v.id]={...current,sku:v.sku,gtin:current?.gtin||v.gtin,colour:v.colour,supplierArticle:v.article};}
  return {...product,name:alpinName,description:copy.en.shortDescription,variants:product.variants.filter(v=>mapping.some(m=>m.id===v.id)),content:{...product.content,details:copy.en.paragraphs.join('\n\n'),composition:'Main fabric: 100% polyester',fit:'Roomy. Non-stretch main fabric. Model: 185 cm, 78 kg, XL.',care:careSymbols.map(symbol=>careCopy.en.instructions[symbol]).join(' · ')+' '+careCopy.en.advice,trade:{...product.content?.trade,colour:alpinColour(alpinArticle(product)!),identifiers}}};
}
export function alpinCopy(locale:AlpinLocale){return copy[locale]}
export function alpinVariantUrl(locale:AlpinLocale,article:string,size?:string) {
  const params=new URLSearchParams({colour:alpinColour(article)});if(size)params.set('size',alpinSize(size));
  return alpinPaths[locale]+'?'+params;
}
