import {savedCartOverview} from '@/lib/cart-sessions';
import {scheduleEmailDelivery} from '@/lib/email-dispatch';
import { db, audit, transaction } from '@/lib/db';
import { getOrder, expireReservations } from '@/lib/commerce';
import { body, checkOrigin, failure, HttpError, requireAdmin } from '@/lib/security';
export const runtime = 'nodejs';
export async function GET(req: Request) { try {
    (await requireAdmin(req));
    (await expireReservations());
    const rows = (await db().prepare('SELECT id FROM orders ORDER BY created_at DESC LIMIT 200').all()) as {
        id: string;
    }[];
    return Response.json({ carts:await savedCartOverview(), orders: await Promise.all(rows.map(async (r) => (await getOrder(r.id)))), audit: (await db().prepare('SELECT * FROM audit ORDER BY id DESC LIMIT 50').all()) }, { headers: { 'Cache-Control': 'no-store' } });
}
catch (e) {
    return failure(e);
} }
export async function PATCH(req: Request) { try {
    checkOrigin(req);
    (await requireAdmin(req));
    const data = await body(req);
    if (!data || typeof data.id !== 'string' || typeof data.tracking !== 'string' || data.tracking.trim().length < 3 || data.tracking.length > 200)
        throw new HttpError(400, 'Provide a valid tracking reference.');
    if(data.carrier!==undefined&&(typeof data.carrier!=='string'||data.carrier.trim().length<2||data.carrier.length>80||data.packingConfirmed!==true))throw new HttpError(400,'Confirm the items are packed and provide the carrier name.');
    if(data.trackingUrl){let url;try{url=new URL(data.trackingUrl)}catch{}if(!url||url.protocol!=='https:'||url.username||url.password||data.trackingUrl.length>1000)throw new HttpError(400,'Use a valid HTTPS tracking link from your carrier.');data.trackingUrl=url.toString();}
    (await transaction(async () => { if(await db().prepare("SELECT id FROM withdrawal_requests WHERE order_id=? AND status='requested'").get(data.id))throw new HttpError(409,'Resolve the customer withdrawal request before shipping this order.'); const result = (await db().prepare("UPDATE orders SET status='fulfilled',tracking=? WHERE id=? AND status='paid'").run(data.tracking, data.id)); if (!result.changes)
        throw new HttpError(409, 'Only paid orders can be fulfilled.'); if(data.carrier){const row=await db().prepare('SELECT customer FROM orders WHERE id=?').get(data.id);const customer=JSON.parse(String(row!.customer));await db().prepare('UPDATE orders SET customer=? WHERE id=?').run(JSON.stringify({...customer,shipment:{carrier:data.carrier.trim(),trackingUrl:data.trackingUrl||'',packedConfirmedAt:new Date().toISOString()}}),data.id);}const order = (await getOrder(data.id))!; (await db().prepare("INSERT OR IGNORE INTO email_outbox(order_id,kind,email) VALUES(?,'shipment',?)").run(data.id, order.email)); (await audit('order.fulfilled', data.id)); }));
    scheduleEmailDelivery();
    return Response.json({ ok: true });
}
catch (e) {
    return failure(e);
} }
