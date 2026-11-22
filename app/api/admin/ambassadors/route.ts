import {z} from 'zod';
import {ambassadorWorkspace,reviewAmbassadorApplication,updateAmbassadorPartnerProfile,setAmbassadorStatus,markAmbassadorCommissionEligible,approveAmbassadorCommission,createAmbassadorPayout,updateAmbassadorPayout,reconcileAmbassadorRefund} from '@/lib/ambassadors';
import {body,checkOrigin,failure,HttpError,requireAdmin} from '@/lib/security';
export const runtime='nodejs';
const schema=z.discriminatedUnion('action',[
 z.object({action:z.literal('review'),applicationId:z.string().uuid(),decision:z.enum(['approve','reject']),note:z.string().trim().min(3).max(1000)}).strict(),
 z.object({action:z.literal('partner-profile'),ambassadorId:z.string().uuid(),partnerType:z.enum(['ambassador','club','coach','creator','team_leader','regional']),partnerLevel:z.enum(['starter','active','top','elite']),commissionPercent:z.number().min(0).max(20),teamLeaderId:z.string().uuid().nullable().optional(),organizationName:z.string().max(160).default(''),organizationType:z.string().max(60).default('')}).strict(),
 z.object({action:z.literal('status'),ambassadorId:z.string().uuid(),status:z.enum(['active','paused','terminated']),reason:z.string().trim().min(3).max(1000)}).strict(),
 z.object({action:z.literal('delivery-review'),orderId:z.string().uuid(),deliveredAt:z.iso.datetime(),returnsClosedAt:z.iso.datetime(),verifiedNetCents:z.number().int().min(0).max(10000000)}).strict(),
 z.object({action:z.literal('commission-approve'),orderId:z.string().uuid()}).strict(),
 z.object({action:z.literal('refund-reconcile'),orderId:z.string().uuid(),verifiedNetCents:z.number().int().min(0).max(10000000)}).strict(),
 z.object({action:z.literal('payout-create'),ambassadorId:z.string().uuid(),start:z.iso.date(),end:z.iso.date(),invoiceReference:z.string().trim().min(1).max(120)}).strict(),
 z.object({action:z.literal('payout-update'),payoutId:z.string().uuid(),decision:z.enum(['approve','paid','cancel']),reference:z.string().max(200).default('')}).strict()
]);
export async function GET(req:Request){try{await requireAdmin(req);return Response.json(await ambassadorWorkspace(),{headers:{'Cache-Control':'no-store'}})}catch(e){return failure(e)}}
export async function POST(req:Request){try{checkOrigin(req);await requireAdmin(req);const parsed=schema.safeParse(await body(req));if(!parsed.success)throw new HttpError(400,'Controleer de actie en de bijbehorende velden.');const v=parsed.data;
 if(v.action==='review')return Response.json(await reviewAmbassadorApplication(v.applicationId,v.decision,'admin',v.note));
 if(v.action==='partner-profile'){await updateAmbassadorPartnerProfile(v.ambassadorId,{partnerType:v.partnerType,partnerLevel:v.partnerLevel,commissionPercent:v.commissionPercent,teamLeaderId:v.teamLeaderId,organizationName:v.organizationName,organizationType:v.organizationType},'admin');return Response.json({ok:true})}
 if(v.action==='status'){await setAmbassadorStatus(v.ambassadorId,v.status,v.reason,'admin');return Response.json({ok:true})}
 if(v.action==='delivery-review'){await markAmbassadorCommissionEligible(v.orderId,'admin',v.deliveredAt,v.returnsClosedAt,v.verifiedNetCents);return Response.json({ok:true})}
 if(v.action==='commission-approve'){await approveAmbassadorCommission(v.orderId,'admin');return Response.json({ok:true})}
 if(v.action==='refund-reconcile'){await reconcileAmbassadorRefund(v.orderId,v.verifiedNetCents,'admin');return Response.json({ok:true})}
 if(v.action==='payout-create')return Response.json(await createAmbassadorPayout(v.ambassadorId,v.start,v.end,'admin',v.invoiceReference),{status:201});
 await updateAmbassadorPayout(v.payoutId,v.decision,'admin',v.reference);return Response.json({ok:true});
 }catch(e){return failure(e)}}