import {isSiteLocale} from '@/lib/i18n/site-routing';
import {localizedPublicCatalog} from '@/lib/localized-public-catalog';
import {stripeKeyMode} from '@/lib/stripe-config';
import {publicProducts} from '@/lib/catalog-view';
import {products} from '@/lib/db';
import {isLive,liveReady} from '@/lib/commerce';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(req?:Request){
 const locale=req?new URL(req.url).searchParams.get('locale'):null;if(locale&&!isSiteLocale(locale))return Response.json({error:'Unsupported catalogue language.'},{status:400});
 const started=performance.now();
 const catalog=(await localizedPublicCatalog(await products(),isSiteLocale(locale)?locale:'en')).map(p=>({...p,variants:p.variants.map(v=>({id:v.id,size:v.size,stock:Math.max(0,v.stock-v.reserved),reserved:0,reported:null}))}));
 return Response.json({products:catalog,mode:isLive()?'live':'demo',paymentEnvironment:isLive()?stripeKeyMode():undefined,ready:liveReady()},{headers:{'Cache-Control':'no-store','Server-Timing':'catalog;dur='+(performance.now()-started).toFixed(1)}});
}

