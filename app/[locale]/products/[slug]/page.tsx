import GenericProductPage,{generateMetadata as genericMetadata} from '@/app/products/[slug]/page';
import {cache} from 'react';
import {notFound,permanentRedirect} from 'next/navigation';
import {sharedProducts} from '@/lib/product-groups';
import {products} from '@/lib/db';
import {isStagingStorePreview} from '@/lib/staging-store-preview';
import {isLive,liveReady} from '@/lib/commerce';
import {hasAlpinTechnology} from '@/lib/alpin-technology';
import {alpinPaths,alpinProductColour,isAlpinLocale,alpinMappingIssues,alpinPublicProduct,alpinSize,alpinSizes,type AlpinLocale} from '@/lib/alpin-fleece';
import {alpinMetadata,alpinStructuredData} from '@/lib/alpin-fleece-seo';
import AlpinFleecePage from '@/components/alpin-fleece-page';
export const dynamic='force-dynamic';
const load=cache(async()=>{const [catalog,preview]=await Promise.all([products(),isStagingStorePreview()]);return {family:sharedProducts(catalog).filter(hasAlpinTechnology),preview}});
type Props={params:Promise<{locale:string;slug:string}>;searchParams:Promise<{colour?:string;size?:string}>};
function indexable(preview:boolean){return !preview&&process.env.INDEXING_ENABLED==='true'&&isLive()&&process.env.LIVE_COMMERCE_APPROVED==='true'}
function canonicalSlug(locale:AlpinLocale){return alpinPaths[locale].split('/').at(-1)}
export async function generateMetadata({params}:Props){const {locale,slug}=await params;if(!isAlpinLocale(locale))return {robots:{index:false,follow:false}};const {family,preview}=await load();if(!['alpin-fleece-jacket','alpin-fleecejas','veste-polaire-alpin',...family.flatMap(p=>[p.slug,...p.content?.trade?.previousSlugs||[]])].includes(slug))return genericMetadata({params:Promise.resolve({slug}),searchParams:Promise.resolve({})});const visible=family.filter(p=>preview||p.active&&p.approved);return alpinMetadata(locale,visible,indexable(preview)&&visible.length>0&&visible.every(p=>p.images.length))}
export default async function Page({params,searchParams}:Props){
 const [{locale,slug},selection,{family,preview}]=await Promise.all([params,searchParams,load()]);
 if(isAlpinLocale(locale)&&!['alpin-fleece-jacket','alpin-fleecejas','veste-polaire-alpin',...family.flatMap(p=>[p.slug,...p.content?.trade?.previousSlugs||[]])].includes(slug))return <GenericProductPage params={Promise.resolve({slug})} searchParams={searchParams}/>;
 if(!isAlpinLocale(locale)||family.length<2||!preview&&!family.some(p=>p.active&&p.approved))notFound();
 const aliases=['alpin-fleece-jacket','alpin-fleecejas','veste-polaire-alpin',...family.flatMap(p=>[p.slug,...p.content?.trade?.previousSlugs||[]])];
 if(slug!==canonicalSlug(locale)){if(!aliases.includes(slug))notFound();const query=new URLSearchParams();const old=family.find(p=>p.slug===slug);query.set('colour',selection.colour||(old?.id==='P002'?'Dusty Blue':'Black'));if(selection.size)query.set('size',alpinSize(selection.size));permanentRedirect(alpinPaths[locale]+'?'+query);}
 const issues=alpinMappingIssues(family);if(issues.length){console.error('ALPIN validation failed:',issues);throw new Error('ALPIN product data needs review before this page can be shown.');}
 const available=family.filter(p=>(preview||p.active&&p.approved)&&p.variants.some(v=>!p.content?.trade?.identifiers?.[v.id]?.archived));
 const requested=/^(mist[ -]blue|emerald[ -]green)$/i.test(selection.colour||'')?'Dusty Blue':selection.colour;
 const selected=requested?available.find(p=>alpinProductColour(p).toLowerCase()===requested.toLowerCase()):available[0];if(!selected)notFound();const colour=alpinProductColour(selected);
 const requestedSize=alpinSize(selection.size||'');
 const size=selected.variants.some(v=>alpinSize(v.size)===requestedSize&&!selected.content?.trade?.identifiers?.[v.id]?.archived)?requestedSize:'';
 const publicFamily=available.map(alpinPublicProduct).map(p=>({...p,variants:p.variants.map(v=>({...v,stock:Math.max(0,v.stock-v.reserved),reserved:0,reported:null}))}));
 return <>{!preview&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(alpinStructuredData(locale,available)).replace(/</g,'\\u003c')}}/>}<AlpinFleecePage key={locale+colour+size} products={publicFamily} locale={locale} initialColour={colour} initialSize={size} preview={preview} mode={isLive()?'live':'demo'} ready={!preview&&liveReady()}/></>;
}
