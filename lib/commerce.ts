import {alpinPublicProduct} from './alpin-fleece';
import {stripeKeyMode} from './stripe-config';
import {databaseSchema,isPostgres} from './database';
import {clubConfig,reserveClubOrder,clubPayment} from './club';
import {productKind} from './club-rules';
import { createHmac } from 'node:crypto';
import { z } from 'zod';
import { db, transaction, products, audit } from './db';
import { hash, HttpError } from './security';
import type { Order, OrderStatus } from './types';
export const checkoutSchema = z.object({ items: z.array(z.object({ variantId: z.string().min(1).max(100), quantity: z.number().int().min(1).max(5) }).strict()).min(1).max(30), email: z.email().max(254), phone: z.string().regex(/^\+[1-9][0-9]{7,14}$/), firstName: z.string().trim().min(1).max(100), lastName: z.string().trim().min(1).max(100), country: z.enum(['BE', 'NL', 'FR', 'DE', 'LU']), address: z.string().trim().min(3).max(200), postal: z.string().trim().min(2).max(20), city: z.string().trim().min(1).max(100), consent: z.literal(true), clubPoints:z.number().int().min(0).max(1000000).multipleOf(100).optional(), requestKey: z.uuid() }).strict();
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export const isLive = () => process.env.COMMERCE_MODE === 'live';
export function liveReady() { const key=process.env.STRIPE_SECRET_KEY||'',schema=databaseSchema();let isolatedTest=false;try{isolatedTest=process.env.NODE_ENV==='test'&&['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL||'').hostname)}catch{}if(isPostgres()&&!process.env.DATABASE_URL)return false;if(isPostgres()&&!isolatedTest&&((schema==='bigk_staging'&&stripeKeyMode(key)!=='test')||(schema==='bigk'&&stripeKeyMode(key)!=='live')))return false;return process.env.COMMERCE_MODE === 'live' && process.env.LIVE_COMMERCE_APPROVED === 'true' && !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_WEBHOOK_SECRET && (process.env.RECEIPT_SECRET?.length || 0) >= 32 && !!process.env.APP_URL?.startsWith('https://'); }
export function shipping(subtotal: number) { return subtotal >= 10000 ? 0 : 695; }
function receipt(id: string) { const secret = process.env.RECEIPT_SECRET || (isLive() ? '' : 'bigk-local-demo-receipts-do-not-use-live'); if (!secret)
    throw new HttpError(503, 'Receipt signing is not configured.'); return createHmac('sha256', secret).update(id).digest('base64url'); }
export async function expireReservations() { (await transaction(async () => { const sql = db(); const stale = (await sql.prepare("SELECT id FROM orders WHERE status='pending' AND expires_at<?").all(new Date().toISOString())) as {
    id: string;
}[]; for (const o of stale) {
    (await release(o.id));
    (await sql.prepare("UPDATE orders SET status='expired' WHERE id=?").run(o.id));
    await clubPayment(o.id,false);
} })); }
async function release(id: string) { const sql = db(); for (const line of (await sql.prepare('SELECT variant_id,quantity FROM order_lines WHERE order_id=?').all(id)) as {
    variant_id: string;
    quantity: number;
}[])
    (await sql.prepare('UPDATE variants SET reserved=reserved-? WHERE id=?').run(line.quantity, line.variant_id)); }
export async function createOrder(input: CheckoutInput, verifiedEmail?:string) {
    if (isLive() && !liveReady())
        throw new HttpError(503, 'Live checkout is not configured and approved.');
    (await expireReservations());
    return (await transaction(async () => {
        const sql = db(), requestHash = hash(JSON.stringify(input)+(verifiedEmail||''));
        if(input.clubPoints&&(!verifiedEmail||verifiedEmail!==input.email.toLowerCase()))throw new HttpError(403,'Sign in with your checkout email to redeem points.');
        const previous = (await sql.prepare('SELECT id,request_hash,status FROM orders WHERE request_key=?').get(input.requestKey)) as {
            id: string;
            request_hash: string;
            status: OrderStatus;
        } | undefined;
        if (previous) {
            if (previous.request_hash !== requestHash)
                throw new HttpError(409, 'This checkout key belongs to another request.');
            if (!['pending', 'demo'].includes(previous.status))
                throw new HttpError(409, 'This checkout has ended. Start a new checkout.');
            return { id: previous.id, receiptToken: receipt(previous.id), reused: true };
        }
        const ids = new Set<string>(), catalog = (await products()).map(alpinPublicProduct);
        let subtotal = 0;
        const lines = input.items.map(line => { if (ids.has(line.variantId))
            throw new HttpError(400, 'Duplicate variant in bag.'); ids.add(line.variantId); const p = catalog.find(p => p.variants.some(v => v.id === line.variantId)), v = p?.variants.find(v => v.id === line.variantId); if (!p || !v || p.priceCents === null || p.priceCents <= 0)
            throw new HttpError(409, 'A product no longer has an available price.'); if(p.content?.trade?.identifiers?.[v.id]?.archived)throw new HttpError(409,'This variant has been archived.'); if (isLive() && (!p.active || !p.approved || !p.images.length || v.stock - v.reserved < line.quantity))
            throw new HttpError(409, `${p.name} is not available in the requested quantity.`); subtotal += p.priceCents * line.quantity; if (!Number.isSafeInteger(subtotal) || subtotal > 10000000)
            throw new HttpError(400, 'Order value exceeds the supported limit.'); return { p, v, quantity: line.quantity }; });
        const id = crypto.randomUUID(), receiptToken = receipt(id), ship = shipping(subtotal), now = new Date(), expires = new Date(now.getTime() + 35 * 60000);
        (await sql.prepare('INSERT INTO orders(id,status,subtotal,shipping,total,email,phone,customer,receipt_hash,request_key,request_hash,created_at,expires_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').run(id, isLive() ? 'pending' : 'demo', subtotal, ship, subtotal + ship, input.email.toLowerCase(), input.phone, JSON.stringify({ firstName: input.firstName, lastName: input.lastName, country: input.country, address: input.address, postal: input.postal, city: input.city }), hash(receiptToken), input.requestKey, requestHash, now.toISOString(), expires.toISOString()));
        for (const line of lines) {
            (await sql.prepare('INSERT INTO order_lines(order_id,variant_id,name,size,quantity,unit_price) VALUES(?,?,?,?,?,?)').run(id, line.v.id, line.p.name, line.v.size, line.quantity, line.p.priceCents!));
            if (isLive())
                (await sql.prepare('UPDATE variants SET reserved=reserved+? WHERE id=?').run(line.quantity, line.v.id));
        }
        if(clubConfig().enabled&&verifiedEmail&&verifiedEmail===input.email.toLowerCase()&&isLive()){const discount=await reserveClubOrder(id,verifiedEmail,lines.map(l=>({id:l.v.id,grossCents:l.p.priceCents!*l.quantity,kind:productKind(l.p.tags)})),input.clubPoints||0,expires.toISOString());if(discount)await sql.prepare('UPDATE orders SET total=total-? WHERE id=?').run(discount,id)}else if(input.clubPoints)throw new HttpError(409,'Point redemption requires an enabled Club and live checkout; demo purchases never spend real points.');
        (await audit('order.created', id));
        return { id, receiptToken, reused: false };
    }));
}
export async function getOrder(id: string): Promise<Order | undefined> { const row = (await db().prepare('SELECT * FROM orders WHERE id=?').get(id)) as Record<string, unknown> | undefined; if (!row)
    return; const c = JSON.parse(String(row.customer)); return { paymentReviewReason:row.status==='payment_review'?((await db().prepare("SELECT action FROM audit WHERE entity=? AND action LIKE 'payment.refund_review.%' ORDER BY id DESC LIMIT 1").get(String(row.id)))?.action as string|undefined)?.split('.').at(-1) as Order['paymentReviewReason']:undefined,deliveryAddress: { name: c.name || [c.firstName, c.lastName].filter(Boolean).join(' '), address: c.address || '', postal: c.postal || '', city: c.city || '', country: c.country || '' }, id: String(row.id), status: row.status as OrderStatus, pointsDiscount:Math.max(0,Number(row.subtotal)+Number(row.shipping)-Number(row.total)), subtotal: Number(row.subtotal), shipping: Number(row.shipping), total: Number(row.total), currency: String(row.currency), email: String(row.email), phone: String(row.phone), createdAt: String(row.created_at), expiresAt: String(row.expires_at), stripeSession: row.stripe_session ? String(row.stripe_session) : null, tracking: row.tracking ? String(row.tracking) : null, withdrawals:(await db().prepare('SELECT * FROM withdrawal_requests WHERE order_id=? ORDER BY created_at DESC').all(id)).map(r=>({id:String(r.id),status:String(r.status),createdAt:String(r.created_at),items:JSON.parse(String(r.snapshot)).items})), items: ((await db().prepare('SELECT variant_id AS variantId,name,size,quantity,unit_price AS unitPrice FROM order_lines WHERE order_id=?').all(id)) as unknown as Order['items']) }; }
export async function verifyReceipt(id: string, value: string) { const row = (await db().prepare('SELECT receipt_hash FROM orders WHERE id=?').get(id)) as {
    receipt_hash: string;
} | undefined; return !!value && row?.receipt_hash === hash(value); }
export async function settlePayment(eventId: string, orderId: string, sessionId: string, amount: number, currency: string, delivery?: {
    name: string;
    address: string;
    postal: string;
    city: string;
    country: string;
}) {
    return (await transaction(async () => {
        const sql = db();
        if ((await sql.prepare('SELECT id FROM webhook_events WHERE id=?').get(eventId)))
            return 'duplicate';
        const order = (await getOrder(orderId));
        if (!order || order.stripeSession !== sessionId)
            throw new HttpError(409, 'Payment session does not match an order.');
        if (['paid', 'fulfilled'].includes(order.status)) {
            (await sql.prepare('INSERT INTO webhook_events VALUES(?,?)').run(eventId, new Date().toISOString()));
            return 'already-paid';
        }
        const holdsReservation = order.status === 'pending';
        const recoverable = ['pending', 'expired', 'cancelled'].includes(order.status);
        const lines = await sql.prepare('SELECT variant_id,quantity FROM order_lines WHERE order_id=?').all(orderId);
        const exactPayment = amount === order.total && currency === order.currency;
        // Expiration releases a reservation, not a verified payment. Reacquire only free stock.
        let stockAvailable = lines.length > 0;
        for (const line of lines) {
            const variant = await sql.prepare('SELECT stock,reserved FROM variants WHERE id=?').get(line.variant_id);
            const free = variant ? Number(variant.stock) - (holdsReservation ? 0 : Number(variant.reserved)) : 0;
            if (!variant || free < Number(line.quantity) || holdsReservation && Number(variant.reserved) < Number(line.quantity)) stockAvailable = false;
        }
        // Released Club points cannot be silently reused for a late discounted order.
        const pointsReleased = !holdsReservation && Boolean(order.pointsDiscount);
        const valid = recoverable && exactPayment && stockAvailable && !pointsReleased;
        if (valid) {
            for (const line of lines) {
                if (holdsReservation) await sql.prepare('UPDATE variants SET stock=stock-?,reserved=reserved-? WHERE id=?').run(line.quantity,line.quantity,line.variant_id);
                else await sql.prepare('UPDATE variants SET stock=stock-? WHERE id=?').run(line.quantity,line.variant_id);
            }
        } else if (holdsReservation) await release(orderId);
        (await sql.prepare('UPDATE orders SET status=? WHERE id=?').run(valid ? 'paid' : 'payment_review', orderId));
        (await sql.prepare('INSERT INTO webhook_events VALUES(?,?)').run(eventId, new Date().toISOString()));
        if (valid && delivery)
            (await sql.prepare('UPDATE orders SET customer=? WHERE id=?').run(JSON.stringify(delivery), orderId));
        await clubPayment(orderId,valid);
        if (valid)
            (await sql.prepare("INSERT OR IGNORE INTO email_outbox(order_id,kind,email) VALUES(?,'confirmation',?)").run(orderId, order.email));
        (await audit(valid ? 'payment.confirmed' : exactPayment && !stockAvailable ? 'payment.refund_review.stock_unavailable' : pointsReleased ? 'payment.refund_review.club_points_released' : 'payment.review', orderId));
        return valid ? 'paid' : 'payment_review';
    }));
}
export async function cancelPayment(eventId: string, orderId: string, sessionId: string) { return (await transaction(async () => { const sql = db(); if ((await sql.prepare('SELECT id FROM webhook_events WHERE id=?').get(eventId)))
    return; const order = (await getOrder(orderId)); if (!order || order.stripeSession !== sessionId)
    throw new HttpError(409, 'Payment session does not match an order.'); if (order.status === 'pending') {
    (await release(orderId));
    (await sql.prepare("UPDATE orders SET status='cancelled' WHERE id=?").run(orderId));
    await clubPayment(orderId,false);
} (await sql.prepare('INSERT INTO webhook_events VALUES(?,?)').run(eventId, new Date().toISOString())); })); }
