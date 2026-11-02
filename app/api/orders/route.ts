import { getOrder, verifyReceipt } from '@/lib/commerce';
import { failure, HttpError, rateLimit } from '@/lib/security';
export const runtime = 'nodejs';
export async function GET(req: Request) { try {
    (await rateLimit('receipt-global', 300, 60));
    const url = new URL(req.url), id = url.searchParams.get('id') || '', value = req.headers.get('authorization')?.replace(/^Bearer /, '') || '';
    if (!(await verifyReceipt(id, value)))
        throw new HttpError(404, 'Order not found or receipt link is invalid.');
    const order = (await getOrder(id))!;
    return Response.json({ id: order.id, status: order.status, subtotal: order.subtotal, shipping: order.shipping, total: order.total, createdAt: order.createdAt, tracking: order.tracking, carrier:order.carrier,trackingUrl:order.trackingUrl, items: order.items }, { headers: { 'Cache-Control': 'no-store' } });
}
catch (e) {
    return failure(e);
} }
