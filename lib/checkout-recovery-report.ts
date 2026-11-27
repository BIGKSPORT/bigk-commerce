import {db} from './db';

export async function checkoutRecoveryReport(now = new Date()) {
  const hour = 60 * 60 * 1000;
  const oldest = new Date(now.getTime() - 48 * hour).toISOString();
  const newest = new Date(now.getTime() - 2 * hour).toISOString();
  const row = await db().prepare(`
    WITH recent_orders AS (
      SELECT id, email, status, created_at,
        ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC, id DESC) AS newest_order
      FROM orders
      WHERE created_at >= ? AND status <> 'demo'
    ), latest_consent AS (
      SELECT email, status, ROW_NUMBER() OVER (
        PARTITION BY email
        ORDER BY occurred_at DESC, created_at DESC,
          CASE WHEN status = 'unsubscribed' THEN 0 ELSE 1 END, id DESC
      ) AS newest_consent
      FROM marketing_consents
      WHERE email IN (SELECT email FROM recent_orders)
    )
    SELECT COUNT(*) AS unpaid,
      COALESCE(SUM(CASE WHEN consent.status='subscribed' THEN 1 ELSE 0 END),0) AS opted_in
    FROM recent_orders AS orders
    LEFT JOIN latest_consent AS consent ON consent.email=orders.email AND consent.newest_consent=1
    WHERE orders.newest_order=1 AND orders.status IN ('cancelled','expired')
      AND orders.created_at <= ?
  `).get(oldest, newest);
  return {unpaid:Number(row?.unpaid??0),optedIn:Number(row?.opted_in??0)};
}
