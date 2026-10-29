import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { db } from './db';
export const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export const token = () => randomBytes(32).toString('base64url');
export class HttpError extends Error {
    constructor(public status: number, message: string) { super(message); }
}
export function checkOrigin(req: Request) { const expected = process.env.APP_URL; if (!expected)
    throw new HttpError(503, 'APP_URL must be configured.'); if (req.headers.get('origin') !== new URL(expected).origin)
    throw new HttpError(403, 'Request origin rejected.'); }
export async function rateLimit(key: string, limit = 20, seconds = 60) { const now = Date.now(); const sql = db(); (await sql.prepare('DELETE FROM rate_limits WHERE expires<?').run(now)); (await sql.prepare('INSERT INTO rate_limits(key,hits,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET hits=hits+1').run(key, now + seconds * 1000)); const row = (await sql.prepare('SELECT hits FROM rate_limits WHERE key=?').get(key)) as {
    hits: number;
}; if (row.hits > limit)
    throw new HttpError(429, 'Too many requests. Please try again later.'); }
export function passwordMatches(password: string) { const encoded = process.env.ADMIN_PASSWORD_HASH || ''; const [salt, key] = encoded.split(':'); if (!salt || !key || !/^[a-f0-9]{128}$/.test(key))
    return false; const actual = scryptSync(password, salt, 64); const expected = Buffer.from(key, 'hex'); return timingSafeEqual(actual, expected); }
export function cookieValue(req: Request, name: string) { return (req.headers.get('cookie') || '').split(';').map(v => v.trim()).find(v => v.startsWith(name + '='))?.slice(name.length + 1) || ''; }
export async function requireAdmin(req: Request) { const value = cookieValue(req, 'bigk_admin'); const session = (await db().prepare('SELECT hash FROM sessions WHERE hash=? AND expires_at>?').get(hash(value), new Date().toISOString())); if (!value || !session)
    throw new HttpError(401, 'Sign in to the admin area.'); }
export function sessionCookie(name: string, value: string, maxAge: number) { return `${name}=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`; }
export function failure(error: unknown) { if (error instanceof HttpError)
    return Response.json({ error: error.message }, { status: error.status, headers: { 'Cache-Control': 'no-store' } }); if (error instanceof SyntaxError)
    return Response.json({ error: 'Invalid request body.' }, { status: 400 }); console.error('Request failed', error instanceof Error ? error.name : 'UnknownError'); return Response.json({ error: 'Unable to complete this request. Please try again.' }, { status: 500 }); }
export async function boundedText(req: Request, maxBytes = 32768) { const reader = req.body?.getReader(); if (!reader)
    return ''; const chunks: Uint8Array[] = []; let length = 0; while (true) {
    const { done, value } = await reader.read();
    if (done)
        break;
    length += value.byteLength;
    if (length > maxBytes) {
        await reader.cancel();
        throw new HttpError(413, 'Request too large.');
    }
    chunks.push(value);
} return Buffer.concat(chunks).toString('utf8'); }
export async function body(req: Request) { try {
    return JSON.parse(await boundedText(req));
}
catch (e) {
    if (e instanceof HttpError)
        throw e;
    throw new HttpError(400, 'Invalid JSON.');
} }
