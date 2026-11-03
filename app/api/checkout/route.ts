import {stripeClient} from '@/lib/stripe-client';
import {customerEmail,clubPaymentItems} from '@/lib/club';
import { checkoutSchema, createOrder, getOrder, isLive } from '@/lib/commerce';
import { body, checkOrigin, failure, rateLimit, rateLimitVisitor, HttpError, hash } from '@/lib/security';
import { db } from '@/lib/db';
export const runtime = 'nodejs';
export async function POST(req: Request) {
    try {
        checkOrigin(req);
        await rateLimitVisitor(req,'checkout',30,60,10000);
        const parsed = checkoutSchema.safeParse(await body(req));
        if (!parsed.success)
            throw new HttpError(400, 'Check your contact details, international phone number, address and bag.');
        (await rateLimit('checkout:' + hash(parsed.data.email.toLowerCase()), 5, 300));
        let email:string|undefined;try{email=await customerEmail(req)}catch(e){if(!(e instanceof HttpError)||e.status!==401)throw e}
        const result = (await createOrder(parsed.data,email)), order = (await getOrder(result.id))!;
        if (!isLive())
            return Response.json({ ...result, mode: 'demo' }, { headers: { 'Cache-Control': 'no-store' } });
        const stripe = stripeClient();
        const base = new URL(process.env.APP_URL!).origin,language=order.language||'en';
        if (order.stripeSession) {
            const session = await stripe.checkout.sessions.retrieve(order.stripeSession);
            if (session.status === 'open' && session.url)
                return Response.json({ ...result, url: session.url, mode: 'live' });
            throw new HttpError(409, 'This payment session is no longer open. Check your order status before trying again.');
        }
        const paymentItems=await clubPaymentItems(order.id)||order.items;
        const session = await stripe.checkout.sessions.create({ mode: 'payment', locale:order.language||'en', adaptive_pricing:{enabled:false}, integration_identifier:'bigk-web-qmhtvznr', customer_email: order.email, client_reference_id: order.id, metadata: { orderId: order.id }, billing_address_collection: 'required', shipping_address_collection: { allowed_countries: ['BE', 'NL', 'FR', 'DE', 'LU'] }, phone_number_collection: { enabled: true }, automatic_tax: { enabled: true }, line_items: paymentItems.map(item => ({ price_data: { currency: 'eur', unit_amount: item.unitPrice, tax_behavior: 'inclusive', product_data: { name: item.name + ' · ' + item.size, tax_code: 'txcd_99999999' } }, quantity: item.quantity })), shipping_options: [{ shipping_rate_data: { display_name: order.shipping === 0 ? 'Standard delivery · Free' : 'Standard delivery', type: 'fixed_amount', fixed_amount: { amount: order.shipping, currency: 'eur' }, tax_behavior: 'inclusive', tax_code: 'txcd_92010001' } }], expires_at: Math.floor(new Date(order.expiresAt).getTime() / 1000), success_url: base + '/'+language+'/order#' + result.id + '.' + result.receiptToken, cancel_url: base + '/'+language+'/checkout?cancelled=1' }, { idempotencyKey: 'bigk-order-' + order.id });
        (await db().prepare('UPDATE orders SET stripe_session=? WHERE id=?').run(session.id, order.id));
        if (!session.url)
            throw new HttpError(502, 'Payment provider did not return a checkout URL.');
        return Response.json({ ...result, url: session.url, mode: 'live' }, { headers: { 'Cache-Control': 'no-store' } });
    }
    catch (e) {
        return failure(e);
    }
}
