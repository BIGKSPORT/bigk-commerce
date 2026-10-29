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
export async function deliverEmails() { if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM || !process.env.APP_URL)
    throw new Error('Email provider and APP_URL must be configured.'); let sent = 0, failed = 0; for (let i = 0; i < 20; i++) {
    const job = (await transaction(async () => { const now = Date.now(); const row = (await db().prepare('SELECT * FROM email_outbox WHERE sent_at IS NULL AND attempts<10 AND next_attempt<=? AND lease_until<=? ORDER BY id LIMIT 1').get(now, now)) as Job | undefined; if (row)
        (await db().prepare('UPDATE email_outbox SET attempts=attempts+1,lease_until=? WHERE id=?').run(now + 60000, row.id)); return row; }));
    if (!job)
        break;
    const order = (await getOrder(job.order_id));
    try {
        if (!order)
            throw Error('Order missing');
        const subject = job.kind === 'shipment' ? 'Your BigK order is on its way' : 'Your BigK order is confirmed';
        const text = [subject, '', 'Order ' + order.id.slice(0, 8).toUpperCase(), ...order.items.map(l => `${l.name} / ${l.size} × ${l.quantity} — ${money(l.unitPrice * l.quantity)}`), '', 'Total: ' + money(order.total), ...(job.kind === 'shipment' && order.tracking ? ['Tracking reference: ' + order.tracking] : []), '', 'View your order history: ' + new URL('/account', process.env.APP_URL).toString()].join('\n');
        const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json', 'Idempotency-Key': 'bigk-outbox-' + job.id }, body: JSON.stringify({ from: process.env.EMAIL_FROM, to: job.email, subject, text }), signal: AbortSignal.timeout(10000) });
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
