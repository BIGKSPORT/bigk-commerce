import {backofficeClub} from '@/lib/admin-overview';
import {z} from 'zod';
import {recordClubDelivery,refundClubOrder,reviewClubOrder} from '@/lib/club';
import {saveEvent} from '@/lib/club-events';
import {body,checkOrigin,failure,HttpError,requireAdmin} from '@/lib/security';
import {audit} from '@/lib/db';
const date=z.iso.datetime();
const schema=z.discriminatedUnion('action',[
 z.object({action:z.literal('review'),orderId:z.string().max(100),blocked:z.boolean(),reason:z.string().min(10).max(1000),manualRelease:z.boolean().default(false)}).strict(),
 z.object({action:z.literal('delivery'),orderId:z.string().max(100),deliveredAt:date}).strict(),
 z.object({action:z.literal('refund'),orderId:z.string().max(100),reference:z.string().min(3).max(200),refunds:z.array(z.object({lineId:z.string().max(100),cumulativeCents:z.number().int().min(0)}).strict()).min(1).max(30)}).strict(),
 z.object({action:z.literal('event'),event:z.object({id:z.string().min(1).max(100),title:z.string().min(1).max(150),description:z.string().max(2000),audience:z.enum(['public','members']),memberOpensAt:date,publicOpensAt:date.nullable(),startsAt:date,location:z.string().min(1).max(200),capacity:z.number().int().min(1).max(100000),maxTickets:z.number().int().min(1).max(20),priceCents:z.number().int().min(0).max(1000000),published:z.boolean()}).strict()}).strict()
]);
export async function POST(req:Request){try{checkOrigin(req);await requireAdmin(req);const d=schema.safeParse(await body(req));if(!d.success)throw new HttpError(400,'Check the Club operation fields.');const v=d.data;if(v.action==='event')await saveEvent(v.event);else if(v.action==='delivery')await recordClubDelivery(v.orderId,v.deliveredAt);else if(v.action==='review')await reviewClubOrder(v.orderId,v.blocked,v.reason,v.manualRelease);else await refundClubOrder(v.orderId,v.refunds,v.reference);await audit('club.admin.'+v.action,v.action==='event'?v.event.id:v.orderId);return Response.json({ok:true})}catch(e){return failure(e)}}

export async function GET(req:Request){try{await requireAdmin(req);return Response.json(await backofficeClub(),{headers:{'Cache-Control':'no-store'}})}catch(e){return failure(e)}}
