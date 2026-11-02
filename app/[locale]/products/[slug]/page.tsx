import {cache} from 'react';
import {notFound,permanentRedirect} from 'next/navigation';
import {products} from '@/lib/db';
import {isStagingStorePreview} from '@/lib/staging-store-preview';
import {isLive,liveReady} from '@/lib/commerce';
import {hasAlpinTechnology} from '@/lib/alpin-technology';
import {alpinPaths,isAlpinLocale,alpinMappingIssues,alpinPublicProduct,alpinSize,alpinSizes,type AlpinLocale} from '@/lib/alpin-fleece';
import {alpinMetadata,alpinStructuredData} from '@/lib/alpin-fleece-seo';
import AlpinFleecePage from '@/components/alpin-fleece-page';
export const dynamic='force-dynamic';
const load=cache(async()=>{const [catalog,preview]=await Promise.all([products(),isStagingStorePreview()]);return {family:catalog.filter(hasAlpinTechnology),preview}});
type Props={params:Promise<{locale:string;slug:string}>;searchParams:Promise<{colour?:string;size?:string}>};
function indexable(preview:boolean){return !preview&&process.env.INDEXING_ENABLED==='true'&&isLive()&&process.env.LIVE_COMMERCE_APPROVED==='true'}
function canonicalSlug(locale:AlpinLocale){return alpinPaths[locale].split('/').at(-1)}
export async function generateMetadata({params}:Props){const {locale}=await params;if(!isAlpinLocale(locale))return {robots:{index:false,follow:false}};const {family,preview}=await load();return alpinMetadata(locale,family,indexable(preview)&&family.every(p=>p.active&&p.approved))}
export default async function Page({params,searchParams}:Props){
 const [{locale,slug},selection,{family,preview}]=await Promise.all([params,searchParams,load()]);
 if(!isAlpinLocale(locale)||family.length!==2||!preview&&family.some(p=>!p.active||!p.approved))notFound();
 const aliases=['alpin-fleece-jacket','alpin-fleecejas','veste-polaire-alpin',...family.flatMap(p=>[p.slug,...p.content?.trade?.previousSlugs||[]])];
 if(slug!==canonicalSlug(locale)){if(!aliases.includes(slug))notFound();const query=new URLSearchParams();const old=family.find(p=>p.slug===slug);query.set('colour',selection.colour||(old?.id==='P002'?'Dusty Blue':'Black'));if(selection.size)query.set('size',alpinSize(selection.size));permanentRedirect(alpinPaths[locale]+'?'+query);}
 const issues=alpinMappingIssues(family);if(issues.length){console.error('ALPIN validation failed:',issues);throw new Error('ALPIN product data needs review before this page can be shown.');}
 const colour=/^(dusty[ -]blue|mist[ -]blue|emerald[ -]green)$/i.test(selection.colour||'')?'Dusty Blue':'Black';
 const requestedSize=alpinSize(selection.size||'');
 const size=alpinSizes.includes(requestedSize as typeof alpinSizes[number])?requestedSize:'';
 const publicFamily=family.map(alpinPublicProduct).map(p=>({...p,variants:p.variants.map(v=>({...v,stock:Math.max(0,v.stock-v.reserved),reserved:0,reported:null}))}));
 return <>{!preview&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(alpinStructuredData(locale,family)).replace(/</g,'\\u003c')}}/>}<AlpinFleecePage key={locale+colour+size} products={publicFamily} locale={locale} initialColour={colour} initialSize={size} preview={preview} mode={isLive()?'live':'demo'} ready={!preview&&liveReady()}/></>;
}
