import {z} from 'zod';
import {db} from '@/lib/db';
import {requireWarehouse} from '@/lib/warehouse-auth';
import {assessWarehouseReturn} from '@/lib/warehouse-inspection';
import {body,checkOrigin,failure,HttpError,rateLimit} from '@/lib/security';

export const runtime='nodejs';
const schema=z.object({
 returnId:z.string().uuid(),
 originalVariantId:z.string().min(1).max(100),
 scannedVariantId:z.string().min(1).max(100),
 scannedSize:z.string().trim().min(1).max(40),
 receivedQuantity:z.number().int().min(0).max(100),
 triedOnOnly:z.boolean(),
 damaged:z.boolean(),
 hygieneOrSafetyConcern:z.boolean(),
 photosTaken:z.boolean(),
}).strict();

/** Preview only: no physical receipt is confirmed and no inventory or payments move. */
export async function POST(req:Request){
 try {
  checkOrigin(req);
  const staff=await requireWarehouse(req,['returns','lead']);
  await rateLimit('warehouse-inspection-preview-'+staff.id,40,300);
  const parsed=schema.safeParse(await body(req));
  if(!parsed.success)throw new HttpError(400,'Controleer retourcode, artikel, maat, aantal en inspectie.');
  const d=parsed.data;
  const row=await db().prepare("SELECT id,order_id,snapshot FROM withdrawal_requests WHERE id=? AND status='requested'").get(d.returnId);
  if(!row)throw new HttpError(404,'Open retouraanvraag niet gevonden.');
  let items:Array<{variantId:string;size:string;quantity:number}>;
  try {
   const snapshot=JSON.parse(String(row.snapshot)) as {items?:Array<{variantId:string;size:string;quantity:number}>};
   if(!Array.isArray(snapshot.items))throw Error('Invalid item snapshot');
   items=snapshot.items;
  }catch{throw new HttpError(409,'Retourgegevens moeten handmatig gecontroleerd worden.');}
  const original=items.find(item=>item.variantId===d.originalVariantId);
  if(!original)throw new HttpError(409,'Artikel komt niet voor in deze retouraanvraag.');
  // Do not trust scanned data as proof of physically received goods.
  const assessment=assessWarehouseReturn({
   reason:'withdrawal',
   orderVerified:true,
   scannedSkuMatches:d.scannedVariantId===original.variantId,
   scannedSizeMatches:d.scannedSize.trim().toUpperCase()===original.size.trim().toUpperCase(),
   receivedQuantity:d.receivedQuantity,
   expectedQuantity:original.quantity,
   sealedOrTriedOnOnly:d.triedOnOnly,
   damaged:d.damaged,
   hygieneOrSafetyConcern:d.hygieneOrSafetyConcern,
   photosRecorded:false, // A checkbox is NOT evidence that photos were stored.
  });
  return Response.json({
   status:'preview_only_not_saved',
   returnId:d.returnId,
   expected:{variantId:original.variantId,size:original.size,quantity:original.quantity},
   assessment,
   photoEvidenceNotStored:true,
   physicalReceiptNotRecorded:true,
   canDispatchExchange:false,
   canRestock:false,
   canRefund:false,
  },{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){return failure(e)}
}
