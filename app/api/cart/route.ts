import {body,checkOrigin,failure,rateLimitVisitor} from '@/lib/security';
import {getSavedCart,saveSavedCart,saveCheckoutContact} from '@/lib/cart-sessions';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(req:Request){try{await rateLimitVisitor(req,'cart-read',60,60,10000);return Response.json(await getSavedCart(req),{headers:{'Cache-Control':'private, no-store'}})}catch(e){return failure(e)}}
export async function POST(req:Request){try{checkOrigin(req);await rateLimitVisitor(req,'cart-save',60,60,10000);const {cookie,...data}=await saveSavedCart(req,await body(req));const headers=new Headers({'Cache-Control':'private, no-store'});if(cookie)headers.set('Set-Cookie',cookie);return Response.json(data,{headers})}catch(e){return failure(e)}}

export async function PUT(req:Request){
 try{
  checkOrigin(req);
  await rateLimitVisitor(req,'cart-contact',30,60,3000);
  const cookie=await saveCheckoutContact(req,await body(req));
  return new Response(null,{status:204,headers:{'Cache-Control':'private, no-store','Set-Cookie':cookie}});
 }catch(e){return failure(e)}
}
