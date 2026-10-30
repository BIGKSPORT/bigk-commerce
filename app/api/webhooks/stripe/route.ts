import Stripe from 'stripe';
import {stripeKeyMode} from '@/lib/stripe-config';
import { cancelPayment, settlePayment } from '@/lib/commerce';
import { boundedText, failure, HttpError } from '@/lib/security';
export const runtime = 'nodejs';
export async function POST(req: Request) {
    try {
        if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET)
            throw new HttpError(503, 'Webhook not configured.');
        const signature = req.headers.get('stripe-signature');
        if (!signature)
            throw new HttpError(400, 'Missing signature.');
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        let event: Stripe.Event;
        try {
            event = stripe.webhooks.constructEvent(await boundedText(req, 1048576), signature, process.env.STRIPE_WEBHOOK_SECRET);
        }
        catch {
            throw new HttpError(400, 'Invalid webhook signature.');
        }
        if (['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'checkout.session.expired', 'checkout.session.async_payment_failed'].includes(event.type)) {
            const session = event.data.object as Stripe.Checkout.Session;
            const expectedLive=stripeKeyMode()==='live';
            if(event.livemode!==expectedLive||session.livemode!==expectedLive)
                throw new HttpError(400,'Payment event belongs to a different Stripe environment.');
            const id = session.metadata?.orderId;
            if (!id)
                throw new HttpError(400, 'Missing order reference.');
            if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed')
                (await cancelPayment(event.id, id, session.id));
            else if (session.payment_status === 'paid')
                (await settlePayment(event.id, id, session.id, session.amount_total ?? -1, session.currency ?? '', session.collected_information?.shipping_details ? { name: session.collected_information.shipping_details.name, address: [session.collected_information.shipping_details.address.line1, session.collected_information.shipping_details.address.line2].filter(Boolean).join(', '), postal: session.collected_information.shipping_details.address.postal_code || '', city: session.collected_information.shipping_details.address.city || '', country: session.collected_information.shipping_details.address.country || '' } : undefined));
        }
        return Response.json({ received: true });
    }
    catch (e) {
        return failure(e);
    }
}
