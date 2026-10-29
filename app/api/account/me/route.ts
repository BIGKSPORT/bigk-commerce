import { db } from '@/lib/db';
import { getOrder } from '@/lib/commerce';
import { cookieValue, failure, hash, HttpError } from '@/lib/security';
export async function GET(req: Request) { try {
    const value = cookieValue(req, 'bigk_customer'), row = (await db().prepare('SELECT email FROM customer_sessions WHERE hash=? AND expires_at>?').get(hash(value), new Date().toISOString())) as {
        email: string;
    } | undefined;
    if (!value || !row)
        throw new HttpError(401, 'Sign in to view your orders.');
    const orders = await Promise.all(((await db().prepare('SELECT id FROM orders WHERE email=? ORDER BY created_at DESC LIMIT 100').all(row.email)) as {
        id: string;
    }[]).map(async (o) => (await getOrder(o.id))));
    return Response.json({ email: row.email, orders }, { headers: { 'Cache-Control': 'no-store' } });
}
catch (e) {
    return failure(e);
} }
