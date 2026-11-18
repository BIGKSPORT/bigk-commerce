import {db} from './db';

export type AdminLiveSnapshot = {
  activeCarts: number;
  checkoutActivity: number;
  purchasedUnits: number;
  paidOrders: number;
  grossCents: number;
  netCents: number | null;
  latestPaidAt: string | null;
  sampledAt: string;
};

const brussels = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Brussels', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});

function wallTime(date: Date) {
  const p = Object.fromEntries(brussels.formatToParts(date).map(part => [part.type, Number(part.value)]));
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
}

export function brusselsDayStart(now: Date) {
  const day = new Date(wallTime(now));
  day.setUTCHours(0, 0, 0, 0);
  const midnight = day.getTime();
  let utc = midnight;
  for (let attempt = 0; attempt < 2; attempt++) utc += midnight - wallTime(new Date(utc));
  return new Date(utc).toISOString();
}

function verifiedNet(snapshot: unknown, total: number): number | null {
  if (typeof snapshot !== 'string') return null;
  try {
    const {net, tax, total: invoiceTotal, test} = JSON.parse(snapshot);
    return test === false && total === invoiceTotal && Number.isSafeInteger(net) &&
      Number.isSafeInteger(tax) && net >= 0 && tax >= 0 && net + tax === total ? net : null;
  } catch {
    return null;
  }
}

export async function readAdminLive(now = new Date()): Promise<AdminLiveSnapshot> {
  const sampledAt = now.toISOString();
  const since = new Date(now.getTime() - 30 * 60_000).toISOString();
  const today = brusselsDayStart(now);
  const testEmails = (process.env.ADMIN_LIVE_TEST_EMAILS ?? '').split(',')
    .map(email => email.trim().toLowerCase()).filter(Boolean).slice(0, 50);
  const includeOrder = testEmails.length ? ' AND LOWER(TRIM(o.email)) NOT IN (' +
    testEmails.map(() => '?').join(',') + ')' : '';
  const counts = await db().prepare(`
    SELECT
      (SELECT COUNT(*) FROM cart_sessions c WHERE c.stage='bag' AND c.order_id IS NULL
        AND c.total>0 AND c.updated_at>=? AND c.expires_at>?) AS active_carts,
      (SELECT COUNT(*) FROM cart_sessions c WHERE c.stage='checkout' AND c.order_id IS NULL
        AND c.total>0 AND c.updated_at>=? AND c.expires_at>?) +
      (SELECT COUNT(*) FROM orders o WHERE o.status='pending'
        AND o.created_at>=? AND o.expires_at>? ${includeOrder}) AS checkout_activity
  `).get(since, sampledAt, since, sampledAt, since, sampledAt, ...testEmails);

  const paid = await db().prepare(`
    SELECT o.total, MIN(a.created_at) AS paid_at, i.snapshot,
      (SELECT COALESCE(SUM(l.quantity),0) FROM order_lines l WHERE l.order_id=o.id) AS units
    FROM orders o JOIN audit a ON a.entity=o.id AND a.action='payment.confirmed'
    LEFT JOIN order_invoices i ON i.order_id=o.id
    WHERE o.status IN ('paid','fulfilled') AND o.currency='eur' ${includeOrder}
    GROUP BY o.id,o.total,i.snapshot
    HAVING MIN(a.created_at)>=? AND MIN(a.created_at)<=?
  `).all(...testEmails, today, sampledAt);
  let grossCents = 0, netCents: number | null = 0, purchasedUnits = 0;
  let latestPaidAt: string | null = null;
  for (const order of paid) {
    const gross = Number(order.total);
    grossCents += gross;
    purchasedUnits += Number(order.units);
    const net = verifiedNet(order.snapshot, gross);
    netCents = netCents === null || net === null ? null : netCents + net;
    const paidAt = String(order.paid_at);
    if (!latestPaidAt || paidAt > latestPaidAt) latestPaidAt = paidAt;
  }
  return {activeCarts:Number(counts?.active_carts ?? 0),checkoutActivity:Number(counts?.checkout_activity ?? 0),
    purchasedUnits,paidOrders:paid.length,grossCents,netCents,latestPaidAt,sampledAt};
}
