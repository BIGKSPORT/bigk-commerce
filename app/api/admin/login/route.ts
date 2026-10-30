import { db, audit } from '@/lib/db';
import { body, checkOrigin, failure, HttpError, hash, token, rateLimit, passwordMatches, sessionCookie } from '@/lib/security';
export const runtime = 'nodejs';
export async function POST(req: Request) { try {
    checkOrigin(req);
    (await rateLimit('admin-login-global', 6, 300));
    if (!process.env.ADMIN_PASSWORD_HASH)
        throw new HttpError(503, 'Admin access is not configured.');
    const data = await body(req);
    if (!data || typeof data.password !== 'string' || data.password.length > 256 || !passwordMatches(data.password))
        throw new HttpError(401, 'Incorrect password.');
    const value = token();
    (await db().prepare('DELETE FROM sessions WHERE expires_at<?').run(new Date().toISOString()));
    (await db().prepare('INSERT INTO sessions(hash,expires_at) VALUES(?,?)').run(hash(value), new Date(Date.now() + 8 * 60 * 60000).toISOString()));
    (await audit('admin.login', 'admin'));
    return Response.json({ ok: true }, { headers: { 'Set-Cookie': sessionCookie('bigk_admin', value, 8 * 3600), 'Cache-Control': 'no-store' } });
}
catch (e) {
    return failure(e);
} }
