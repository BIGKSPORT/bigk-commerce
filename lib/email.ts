import {emailDeliveryAllowed} from './email-policy';
import {createHash} from 'node:crypto';
import {clubReminder} from './club';
import { db, transaction } from './db';
import { getOrder } from './commerce';
import { money } from './format';
type Job = {
    id: number;
    order_id: string;
    kind: string;
    email: string;
    attempts: number;
};
export async function deliverEmails(maxJobs=20) { if(!Number.isInteger(maxJobs)||maxJobs<1||maxJobs>20)throw new Error('Email batch size must be between 1 and 20.'); if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM || !process.env.APP_URL)
    throw new Error('Email provider and APP_URL must be configured.'); let sent = 0, failed = 0; for (let i = 0; i < maxJobs; i++) {
    const job = (await transaction(async () => { const now = Date.now(); const row = (await db().prepare('SELECT * FROM email_outbox WHERE sent_at IS NULL AND attempts<10 AND next_attempt<=? AND lease_until<=? ORDER BY id LIMIT 1').get(now, now)) as Job | undefined; if(row&&!emailDeliveryAllowed(row.email))return {...row,blocked:true};
    if (row)
        (await db().prepare('UPDATE email_outbox SET attempts=attempts+1,lease_until=? WHERE id=?').run(now + 60000, row.id)); return row; }));
    if (!job)
        break;
    if('blocked' in job)return {sent,failed,blocked:true};
    const order = (await getOrder(job.order_id));
    try {
        if (!order)
            throw Error('Order missing');
        const reminder=job.kind.startsWith('club-expiry:')?await clubReminder(job.email,job.kind.slice('club-expiry:'.length)):null;
        if(job.kind.startsWith('club-expiry:')&&!reminder){await db().prepare('UPDATE email_outbox SET sent_at=?,lease_until=0 WHERE id=?').run(new Date().toISOString(),job.id);continue}
        const withdrawal=job.kind.startsWith('withdrawal:')?await db().prepare('SELECT * FROM withdrawal_requests WHERE id=? AND order_id=?').get(job.kind.slice('withdrawal:'.length),job.order_id):null;
        const subject = withdrawal?'Your BigK withdrawal request has been received':reminder?'Your BigK Club points expire soon': job.kind === 'shipment' ? 'Your BigK order is on its way' : 'Your BigK order is confirmed';
        const text = withdrawal?['BIGK BV acknowledges your withdrawal request.','Reference: '+String(withdrawal.id),'Received: '+String(withdrawal.created_at),JSON.parse(String(withdrawal.snapshot)).statement,...JSON.parse(String(withdrawal.snapshot)).items.map((l:{name:string;size:string;quantity:number})=>l.name+' / '+l.size+' × '+l.quantity),'This acknowledgement records your request; it does not confirm that a refund has already been issued.'].join('\n'):reminder?['You have '+reminder.points+' BigK Club points expiring on '+new Date(reminder.expiresAt).toLocaleDateString('en-GB',{timeZone:'Europe/Brussels'})+'.','Check your current balance and rules: '+new URL('/account/club',process.env.APP_URL).toString(),'100 points = €3, subject to the 10% product-subtotal limit.'].join('\n'):[subject, '', 'Order ' + order.id.slice(0, 8).toUpperCase(), ...order.items.map(l => `${l.name} / ${l.size} × ${l.quantity} — ${money(l.unitPrice * l.quantity)}`), '', ...(order.pointsDiscount?['BigK Club discount: -'+money(order.pointsDiscount)]:[]), 'Subtotal: ' + money(order.subtotal), 'Delivery: ' + money(order.shipping), 'Total: ' + money(order.total), ...(job.kind === 'shipment' && order.tracking ? ['Tracking reference: ' + order.tracking] : []), '', 'View your order history: ' + new URL('/account', process.env.APP_URL).toString()].join('\n');
        const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json', 'Idempotency-Key': 'bigk-'+createHash('sha256').update((process.env.APP_URL||'')+'|'+(process.env.DATABASE_SCHEMA||'bigk')).digest('hex').slice(0,16)+'-outbox-' + job.id }, body: JSON.stringify({ from: process.env.EMAIL_FROM, to: job.email, subject, text }), signal: AbortSignal.timeout(10000) });
        if (!response.ok)
            throw Error('Provider rejected delivery');
        (await db().prepare('UPDATE email_outbox SET sent_at=?,lease_until=0 WHERE id=?').run(new Date().toISOString(), job.id));
        sent++;
    }
    catch {
        (await db().prepare('UPDATE email_outbox SET next_attempt=?,lease_until=0 WHERE id=?').run(Date.now() + Math.min(3600000, 60000 * 2 ** job.attempts), job.id));
        failed++;
    }
} return { sent, failed }; }
