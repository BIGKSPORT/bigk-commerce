import {isSiteLocale,siteLanguageCookie} from '@/lib/i18n/site-routing';
import {emailDeliveryAllowed} from '@/lib/email-policy';
import { z } from 'zod';
import { db } from '@/lib/db';
import { body, checkOrigin, failure, hash, HttpError, rateLimit, rateLimitVisitor, token,cookieValue } from '@/lib/security';
export async function POST(req: Request) { try {
    checkOrigin(req);
    await rateLimitVisitor(req,'magic-link',10,300,5000);
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)
        throw new HttpError(503, 'Customer sign-in is not available until the store email service is connected.');
    const parsed = z.object({ email: z.email().max(254) }).safeParse(await body(req));
    if (!parsed.success)
        throw new HttpError(400, 'Enter a valid email.');
    const email = parsed.data.email.toLowerCase();
    if(!emailDeliveryAllowed(email))throw new HttpError(503,'Email delivery is disabled for this environment.');
    (await rateLimit('magic:' + hash(email), 3, 900));
    const value = token(), url = new URL('/api/account/verify', process.env.APP_URL!);
    url.searchParams.set('token', value);const preference=cookieValue(req,siteLanguageCookie),language=isSiteLocale(preference)?preference:'en';url.searchParams.set('lang',language);
    (await db().prepare('DELETE FROM login_tokens WHERE expires_at<?').run(new Date().toISOString()));
    (await db().prepare('INSERT INTO login_tokens VALUES(?,?,?)').run(hash(value), email, new Date(Date.now() + 15 * 60000).toISOString()));
    const result = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: process.env.EMAIL_FROM, to: email, subject: ({en:'Your BigK sign-in link',nl:'Je BIG K-aanmeldlink',fr:'Votre lien de connexion BIG K'})[language], text: ({en:'Sign in to your BigK account:',nl:'Meld je aan bij je BIG K-account:',fr:'Connectez-vous à votre compte BIG K :'})[language]+'\n\n'+url.toString()+'\n\n'+({en:'This link expires in 15 minutes. If you did not request it, you can ignore this email.',nl:'Deze link verloopt na 15 minuten. Heb je deze niet aangevraagd, dan kun je deze e-mail negeren.',fr:'Ce lien expire dans 15 minutes. Si vous ne l’avez pas demandé, ignorez cet e-mail.'})[language] }), signal: AbortSignal.timeout(10000) });
    if (!result.ok) {
        (await db().prepare('DELETE FROM login_tokens WHERE hash=?').run(hash(value)));
        throw new HttpError(502, 'Sign-in email could not be sent. Please try again later.');
    }
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
catch (e) {
    return failure(e);
} }
