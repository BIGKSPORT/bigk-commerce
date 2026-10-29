import { z } from 'zod';
import { db } from '@/lib/db';
import { body, checkOrigin, failure, hash, HttpError, rateLimit, token } from '@/lib/security';
export async function POST(req: Request) { try {
    checkOrigin(req);
    (await rateLimit('magic-link-global', 20, 300));
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)
        throw new HttpError(503, 'Customer sign-in is not available until the store email service is connected.');
    const parsed = z.object({ email: z.email().max(254) }).safeParse(await body(req));
    if (!parsed.success)
        throw new HttpError(400, 'Enter a valid email.');
    const email = parsed.data.email.toLowerCase();
    (await rateLimit('magic:' + hash(email), 3, 900));
    const value = token(), url = new URL('/api/account/verify', process.env.APP_URL!);
    url.searchParams.set('token', value);
    (await db().prepare('DELETE FROM login_tokens WHERE expires_at<?').run(new Date().toISOString()));
    (await db().prepare('INSERT INTO login_tokens VALUES(?,?,?)').run(hash(value), email, new Date(Date.now() + 15 * 60000).toISOString()));
    const result = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: process.env.EMAIL_FROM, to: email, subject: 'Your BigK sign-in link', text: 'Sign in to your BigK account:\n\n' + url.toString() + '\n\nThis link expires in 15 minutes. If you did not request it, you can ignore this email.' }), signal: AbortSignal.timeout(10000) });
    if (!result.ok) {
        (await db().prepare('DELETE FROM login_tokens WHERE hash=?').run(hash(value)));
        throw new HttpError(502, 'Sign-in email could not be sent. Please try again later.');
    }
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
catch (e) {
    return failure(e);
} }
