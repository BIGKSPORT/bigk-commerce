import { db, transaction } from '@/lib/db';
import { hash, token, sessionCookie } from '@/lib/security';
export async function GET(req: Request) { const value = new URL(req.url).searchParams.get('token') || ''; const session = token(); const email = (await transaction(async () => { const row = (await db().prepare('SELECT email FROM login_tokens WHERE hash=? AND expires_at>?').get(hash(value), new Date().toISOString())) as {
    email: string;
} | undefined; if (!row)
    return null; (await db().prepare('DELETE FROM login_tokens WHERE hash=?').run(hash(value))); (await db().prepare('DELETE FROM customer_sessions WHERE expires_at<?').run(new Date().toISOString())); (await db().prepare('INSERT INTO customer_sessions VALUES(?,?,?)').run(hash(session), row.email, new Date(Date.now() + 7 * 24 * 3600000).toISOString())); return row.email; })); const target = new URL('/account', process.env.APP_URL || new URL(req.url).origin); if (!email)
    target.searchParams.set('error', 'expired'); return new Response(null, { status: 303, headers: { Location: target.toString(), ...(email ? { 'Set-Cookie': sessionCookie('bigk_customer', session, 7 * 24 * 3600) } : {}), 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } }); }
