import { db } from '@/lib/db';
import { checkOrigin, cookieValue, failure, hash, sessionCookie } from '@/lib/security';
export async function POST(req: Request) { try {
    checkOrigin(req);
    (await db().prepare('DELETE FROM customer_sessions WHERE hash=?').run(hash(cookieValue(req, 'bigk_customer'))));
    return Response.json({ ok: true }, { headers: { 'Set-Cookie': sessionCookie('bigk_customer', '', 0) } });
}
catch (e) {
    return failure(e);
} }
