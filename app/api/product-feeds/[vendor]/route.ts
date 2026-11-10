import {products} from '@/lib/db';
import {catalogueFeed,googleFeedXml,metaFeedCsv} from '@/lib/catalogue-feed';
import {feedsEnabled,validFeedToken} from '@/lib/product-feed-access';
import {failure} from '@/lib/security';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, max-age=300','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff'};
export async function GET(req:Request,{params}:{params:Promise<{vendor:string}>}){
 try{
  const {vendor}=await params;
  if((vendor!=='google'&&vendor!=='meta')||!feedsEnabled()||!validFeedToken(vendor,new URL(req.url).searchParams.get('token')))return new Response('Not found',{status:404,headers:{...headers,'Cache-Control':'no-store'}});
  const {items}=catalogueFeed(await products());
  return new Response(vendor==='google'?googleFeedXml(items):metaFeedCsv(items),{headers:{...headers,'Content-Type':vendor==='google'?'application/xml; charset=utf-8':'text/csv; charset=utf-8'}});
 }catch(error){return failure(error)}
}
