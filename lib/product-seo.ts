import type {Metadata} from 'next';
import type {Product} from './types';
import type {SiteLocale} from './i18n/site-routing';
import {siteLocales,localizePath} from './i18n/site-routing';
import {alpinPaths} from './alpin-fleece';
import {seller} from './seller';
export const seoEnabled=()=>process.env.PRODUCT_SEO_ENABLED!=='false';
export function productPath(path:string,locale:SiteLocale){return localizePath(path,locale)}
export function languageAlternates(path:string):Record<SiteLocale|'x-default',string>{
 return Object.fromEntries([...siteLocales.map(locale=>[locale,seller.origin+productPath(path,locale)]),['x-default',seller.origin+productPath(path,'en')]]) as Record<SiteLocale|'x-default',string>;
}
export function productMetadata(product:Product|undefined,images:string[],path:string|undefined,locale:SiteLocale,indexable:boolean):Metadata{
 const title=product?.content?.localizedCopy?.seoTitle||product?.content?.trade?.seoTitle||product?.name||'Product not found';
 const description=(product?.content?.localizedCopy?.seoDescription||product?.content?.trade?.seoDescription||product?.content?.details||product?.description||'').slice(0,320);
 const url=path?seller.origin+productPath(path,locale):undefined;
 const photo=images[0]?new URL(images[0],seller.origin).href:undefined;
 return {title,description,robots:{index:indexable,follow:true},...(url?{alternates:{canonical:url,languages:languageAlternates(path!)}}:{}),
 openGraph:{type:'website',title,description,url,siteName:'BIG K',locale:locale==='nl'?'nl_BE':locale==='fr'?'fr_BE':'en_GB',images:photo?[{url:photo,alt:product?.name||'BIG K'}]:[]},
 twitter:{card:'summary_large_image',title,description,images:photo?[photo]:[]}};
}
export function sitemapLanguages(path:string){return languageAlternates(path)}
export function alpinCanonicalPath(locale:SiteLocale){return alpinPaths[locale]}
