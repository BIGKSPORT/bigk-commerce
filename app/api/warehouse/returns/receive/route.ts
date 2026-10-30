import {z} from 'zod';
import {db,transaction,audit} from '@/lib/db';
import {requireWarehouse} from '@/lib/warehouse-auth';
import {assessWarehouseReturn} from '@/lib/warehouse-inspection';
import {body,checkOrigin,failure,HttpError,rateLimit,hash} from '@/lib/security';
export const runtime='nodejs';
const input=z.object({
 requestKey:z.uuid(),returnId:z.uuid(),variantId:z.string().min(1).max(100),
 scannedVariantId:z.string().min(1).max(100),scannedSize:z.string().trim().min(1).max(40),
 receivedQuantity:z.number().int().min(0).max(100),
 triedOnOnly:z.boolean(),damaged:z.boolean(),hygieneOrSafetyConcern:z.boolean(),
}).strict();
/** Physical receipt ONLY; no restock, customer refund, exchange dispatch, or email. */
export async function POST(req:Request){
 try{
  checkOrigin(req);
  const user=await requireWarehouse(req,['returns','lead']);
  await rateLimit('warehouse-receipt-'+user.id,30,300);
  const parsed=input.safeParse(await body(req));
  if(!parsed.success)throw new HttpError(400,'Vul retourcode, gescande maat en ontvangen aantal correct in.');
  const data=parsed.data;
  const result=await transaction(async()=>{
   const previous=await db().prepare('SELECT * FROM warehouse_return_receipts WHERE request_key=?').get(data.requestKey);
   const fingerprint=hash(JSON.stringify(data));
   if(previous){
    const prior=JSON.parse(String(previous.condition_snapshot)) as {fingerprint:string};
    if(prior.fingerprint!==fingerprint)throw new HttpError(409,'Deze ontvangstcode is al met andere gegevens gebruikt.');
    return {receiptId:String(previous.id),alreadyRecorded:true};
   }
   const row=await db().prepare("SELECT order_id,snapshot FROM withdrawal_requests WHERE id=? AND status='requested'").get(data.returnId);
   if(!row)throw new HttpError(404,'Open retouraanvraag ontbreekt.');
   let item:{variantId:string;size:string;quantity:number}|undefined;
   try{
    const snap=JSON.parse(String(row.snapshot)) as {items:Array<{variantId:string;size:string;quantity:number}>};
    item=snap.items.find(v=>v.variantId===data.variantId);
   }catch{throw new HttpError(409,'Retourgegevens moeten manueel worden nagekeken.');}
   if(!item)throw new HttpError(409,'Artikel hoort niet bij de retouraanvraag.');
   // Multiple partial receipts for one variant are held for warehouse lead review.
   const earlier=await db().prepare('SELECT received_quantity FROM warehouse_return_receipts WHERE return_id=? AND variant_id=?').all(data.returnId,data.variantId);
   const previouslyReceived=earlier.reduce((sum,r)=>sum+Number(r.received_quantity),0);
   if(previouslyReceived+data.receivedQuantity>item.quantity)
    throw new HttpError(409,'Totaal ontvangen aantal overschrijdt de retouraanvraag.');
   const assessment=assessWarehouseReturn({
    reason:'withdrawal',orderVerified:true,
    scannedSkuMatches:data.scannedVariantId===item.variantId,
    scannedSizeMatches:data.scannedSize.toUpperCase()===item.size.trim().toUpperCase(),
    receivedQuantity:data.receivedQuantity,
    expectedQuantity:item.quantity-previouslyReceived,
    sealedOrTriedOnOnly:data.triedOnOnly,
    damaged:data.damaged,hygieneOrSafetyConcern:data.hygieneOrSafetyConcern,
    photosRecorded:false, // No photo storage/verification is yet implemented.
   });
   const receiptId=crypto.randomUUID(),createdAt=new Date().toISOString();
   const snapshot={...data,fingerprint,assessment,previouslyReceived,photoEvidenceStored:false};
   await db().prepare('INSERT INTO warehouse_return_receipts(id,request_key,return_id,order_id,variant_id,received_quantity,staff_id,condition_snapshot,created_at) VALUES(?,?,?,?,?,?,?,?,?)').run(
    receiptId,data.requestKey,data.returnId,String(row.order_id),data.variantId,
    data.receivedQuantity,user.id,JSON.stringify(snapshot),createdAt);
   await audit('warehouse.return_received',receiptId);
   return {receiptId,alreadyRecorded:false,assessment};
  });
  return Response.json({status:'receipt_logged_on_hold',...result,inventoryChanged:false,refundIssued:false,exchangeDispatched:false},{
   headers:{'Cache-Control':'private, no-store'}
  });
 }catch(e){return failure(e)}
}
