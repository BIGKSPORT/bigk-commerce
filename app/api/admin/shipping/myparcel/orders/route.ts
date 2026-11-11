import {z} from 'zod';
import {requireAdmin,checkOrigin,body,failure,HttpError,rateLimit} from '@/lib/security';
import {checkMyParcelConnection,orderLabelSchema,orderLabelStatus,createOrderLabel,refreshOrderLabel,orderLabelPdf} from '@/lib/myparcel-orders';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const refresh=z.object({action:z.literal('refresh'),orderId:z.uuid()}).strict();
export async function GET(req:Request){try{
 await requireAdmin(req);await rateLimit('admin-order-label-read',40,60);
 const url=new URL(req.url),id=url.searchParams.get('orderId');
 if(!id)return Response.json(await checkMyParcelConnection(),{headers:{'Cache-Control':'no-store'}});
 if(!z.uuid().safeParse(id).success)throw new HttpError(400,'Invalid order ID.');
 if(url.searchParams.get('download')==='1')return new Response(new Uint8Array(await orderLabelPdf(id)),{headers:{'Content-Type':'application/pdf','Content-Disposition':'inline; filename="BIGK-label-'+id+'.pdf"','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"}});
 return Response.json(await orderLabelStatus(id),{headers:{'Cache-Control':'no-store'}});
}catch(error){return failure(error);}}
export async function POST(req:Request){try{
 checkOrigin(req);await requireAdmin(req);await rateLimit('admin-order-label-write',20,300);
 const input=await body(req),refreshInput=refresh.safeParse(input);
 if(refreshInput.success)return Response.json(await refreshOrderLabel(refreshInput.data.orderId),{headers:{'Cache-Control':'no-store'}});
 const create=orderLabelSchema.safeParse(input);if(!create.success)throw new HttpError(400,'Review the street, house number and measured parcel weight, then confirm the address.');
 return Response.json(await createOrderLabel(create.data),{headers:{'Cache-Control':'no-store'}});
}catch(error){return failure(error);}}
