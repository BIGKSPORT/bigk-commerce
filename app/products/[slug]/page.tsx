import {searchSku,searchDescription,searchShippingDetails,searchReturnPolicy} from '@/lib/product-search-data';
import {localizedPublicCatalog} from '@/lib/localized-public-catalog';
import {publicIndexingEnabled} from '@/lib/search-visibility';
import {publicCategoryOptions} from '@/lib/catalog-categories';
import {siteLocales} from '@/lib/i18n/site-routing';
import {getSiteLanguage} from '@/lib/i18n/site-server';
import {storefrontContext} from '@/lib/storefront-context';
import {hasAlpinTechnology} from '@/lib/alpin-technology';
import {alpinArticle,alpinVariantUrl} from '@/lib/alpin-fleece';
import {publicProducts,visibleProducts,resolveProduct} from '@/lib/catalog-view';
import {resolveGroupSelection} from '@/lib/product-group-routing';
import {b10WhiteProductCopy} from '@/lib/b10-white-copy';
import {isB10White} from '@/lib/product-public-urls';
import {groupUrl} from '@/lib/product-groups';
import {seller} from '@/lib/seller';
import {notFound,permanentRedirect} from 'next/navigation';
import {isLive,liveReady} from '@/lib/commerce';
import Storefront from '@/components/storefront';
export const dynamic='force-dynamic';
type Props={params:Promise<{slug:string}>;searchParams:Promise<{colour?:string;colourId?:string;size?:string}>};
async function selection(props:Props){const {slug}=await props.params,query=await props.searchParams,{catalog:raw,preview}=await storefrontContext(),catalog=preview?visibleProducts(raw):await localizedPublicCatalog(raw);const resolved=resolveGroupSelection(raw,catalog,slug,query);if(resolved){const copy=catalog.find(p=>p.id===resolved.root.id)||resolved.selected.product;resolved.root={...resolved.root,description:copy.description,content:copy.content};}return {raw,catalog,preview,slug,query,resolved}}
export async function generateMetadata(props:Props){const {path,locale}=await getSiteLanguage();const {resolved,preview}=await selection(props),colour=resolved?.selected,p=resolved&&b10WhiteProductCopy(resolved.root,colour?.colour,locale);const description=(p?.content?.trade?.seoDescription||p?.content?.details||p?.description||'').slice(0,320);return {title:p?.content?.trade?.seoTitle||p?.name||'Product not found',description,alternates:resolved?{canonical:path(resolved.canonical),languages:Object.fromEntries(siteLocales.map(l=>[l,'/'+l+resolved.canonical]))}:undefined,robots:{index:!preview&&Boolean(colour?.product.approved&&colour?.product.active&&colour?.images.length)&&publicIndexingEnabled(),follow:true},openGraph:p&&resolved?{title:p.content?.trade?.seoTitle||p.name,description,url:path(resolved.canonical),images:colour?.images.length?[{url:colour.images[0]}]:[]}:undefined}}
export default async function ProductPage(props:Props){
 const {path,locale}=await getSiteLanguage();const {raw,catalog,preview,slug,query,resolved}=await selection(props);const requested=resolveProduct(raw,slug);
 if(requested&&hasAlpinTechnology(requested)){if(!resolved)notFound();permanentRedirect(path(groupUrl(raw,resolved.selected,resolved.size)));}
 if(!resolved)notFound();const {selected,options,size}=resolved;const root=b10WhiteProductCopy(resolved.root,selected.colour,locale);if(resolved.redirect)permanentRedirect(path(resolved.redirect));
 const canonical=seller.origin+path(resolved.canonical);
 const groupCanonical=seller.origin+path('/products/'+resolved.groupSlug);
 const whitePage=isB10White(root.id,selected.colour);
 const structuredOptions=whitePage?[selected]:options;
 const json={'@context':'https://schema.org','@type':'ProductGroup','@id':groupCanonical+'#group',productGroupID:root.id,variesBy:['https://schema.org/size','https://schema.org/color'],name:root.name,description:searchDescription(root),brand:{'@type':'Brand',name:'BIG K ®'},url:canonical,image:structuredOptions.flatMap(o=>o.images).filter((image,index,all)=>all.indexOf(image)===index),hasVariant:structuredOptions.flatMap(option=>option.variants.map(v=>{const identifier=option.product.content?.trade?.identifiers?.[v.id];return {'@type':'Product','@id':canonical+'#'+encodeURIComponent(v.id),name:root.name,description:searchDescription(b10WhiteProductCopy(option.product,option.colour,locale))||searchDescription(root),size:v.size,color:option.colour,sku:searchSku(identifier?.sku,v.id),...(identifier?.gtin?{['gtin'+identifier.gtin.length]:identifier.gtin}:{}),image:option.images,url:seller.origin+path(groupUrl(raw,option,v.size)),...(option.product.priceCents===null?{}:{offers:{'@type':'Offer',price:(option.product.priceCents/100).toFixed(2),priceCurrency:'EUR',hasMerchantReturnPolicy:searchReturnPolicy,shippingDetails:searchShippingDetails(option.product.priceCents),availability:'https://schema.org/'+(v.stock-v.reserved>0?'InStock':'OutOfStock'),url:seller.origin+path(groupUrl(raw,option,v.size))}})}}))};
 return <>{preview&&<div className="info-message" role="status">PRIVATE STORE PREVIEW · Purchasing disabled · <a href="/#catalog">Back to collection</a></div>}{query.size&&!size&&<p className="info-message" role="status">That size is unavailable for this colour. Please choose a size.</p>}{!preview&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(json).replace(/</g,'\\u003c')}}/>}<Storefront categoryOptions={await publicCategoryOptions()} products={catalog.map(p=>({...p,variants:p.variants.filter(v=>!p.content?.trade?.identifiers?.[v.id]?.archived).map(v=>({...v,stock:Math.max(0,v.stock-v.reserved),reserved:0,reported:null}))}))} mode={preview?'live':isLive()?'live':'demo'} ready={preview?false:liveReady()} initialProduct={selected.product.id} initialColour={selected.colour} initialSize={size}/></>;
}



