import {stripeKeyMode} from '@/lib/stripe-config';
import {publicProducts} from '@/lib/catalog-view';
import {products} from '@/lib/db';
import {isLive,liveReady} from '@/lib/commerce';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){
 const started=performance.now();
 const catalog=publicProducts(await products()).map(p=>({...p,variants:p.variants.map(v=>({id:v.id,size:v.size,stock:Math.max(0,v.stock-v.reserved),reserved:0,reported:null}))}));
 return Response.json({products:catalog,mode:isLive()?'live':'demo',paymentEnvironment:isLive()?stripeKeyMode():undefined,ready:liveReady()},{headers:{'Cache-Control':'no-store','Server-Timing':'catalog;dur='+(performance.now()-started).toFixed(1)}});
}
