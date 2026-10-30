import {db} from '@/lib/db';
import {requireWarehouse} from '@/lib/warehouse-auth';
import {failure} from '@/lib/security';
export const runtime='nodejs';
export const dynamic='force-dynamic';

/** Read-only, unassigned operational queues. No personal or financial data. */
export async function GET(req:Request){
 try {
  const account=await requireWarehouse(req);
  const canPick=account.role==='picker'||account.role==='lead';
  const canInspect=account.role==='returns'||account.role==='lead';
  const picking=canPick
   ?await db().prepare("SELECT id,created_at FROM orders WHERE status='paid' ORDER BY created_at ASC LIMIT 40").all()
   :[];
  const returns=canInspect
   ?await db().prepare("SELECT id,order_id,created_at,snapshot FROM withdrawal_requests WHERE status='requested' ORDER BY created_at ASC LIMIT 40").all()
   :[];
  const pickTasks=await Promise.all(picking.map(async row=>{
   const orderId=String(row.id);
   const items=await db().prepare('SELECT variant_id,name,size,quantity FROM order_lines WHERE order_id=?').all(orderId);
   return {orderId,createdAt:String(row.created_at),
    assignedTo:null,
    items:items.map(i=>({variantId:String(i.variant_id),name:String(i.name),size:String(i.size),quantity:Number(i.quantity)})),
   };
  }));
  const returnTasks=returns.map(row=>{
   // Snapshot includes customer details; only expose item identifiers and quantities.
   const snap=JSON.parse(String(row.snapshot)) as {items?:Array<{variantId:string;name:string;size:string;quantity:number}>};
   const items=Array.isArray(snap.items)?snap.items.map(i=>({
    variantId:String(i.variantId),name:String(i.name),size:String(i.size),quantity:Number(i.quantity),
   })):[];
   return {returnId:String(row.id),orderId:String(row.order_id),createdAt:String(row.created_at),items,assignedTo:null};
  });
  return Response.json({
   account:{id:account.id,name:account.name,role:account.role},
   picking:pickTasks,returns:returnTasks,
   queueStatus:'unassigned_read_only',
   readOnly:true,canClaimTasks:false,canCreateLabels:false,
   canChangeInventory:false,canIssueRefunds:false,
  },{headers:{'Cache-Control':'private, no-store'}});
 }catch(error){return failure(error)}
}
