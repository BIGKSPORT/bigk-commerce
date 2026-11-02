import {isIP} from 'node:net';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { db, transaction } from './db';
export const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export const token = () => randomBytes(32).toString('base64url');
export class HttpError extends Error {
    constructor(public status: number, message: string) { super(message); }
}
export function checkOrigin(req: Request) {
    // Do not derive trusted origins from request Host/X-Forwarded-Host.
    // A stable branch alias is required so a preview admin cookie survives deploys.
    const trusted = process.env.VERCEL_ENV === 'preview'
        ? [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]
            .filter((value): value is string => !!value)
            .map(host => 'https://' + host)
        : [process.env.APP_URL].filter((value): value is string => !!value);
    if(process.env.VERCEL_ENV==='preview' && process.env.ADMIN_CANONICAL_ORIGIN) trusted.push(process.env.ADMIN_CANONICAL_ORIGIN);
    if (!trusted.length) throw new HttpError(503, 'APP_URL must be configured.');
    const origin = req.headers.get('origin');
    if (!origin || !trusted.some(candidate => new URL(candidate).origin === origin))
        throw new HttpError(403, 'Request origin rejected.');
}
export function visitorRateKey(req:Request,platform=process.env.VERCEL==='1'?'vercel':process.env.NETLIFY==='true'?'netlify':'local'){
    // Trust forwarding headers only when our hosting platform owns the ingress.
    const address=(platform==='vercel'?req.headers.get('x-forwarded-for'):platform==='netlify'?req.headers.get('x-nf-client-connection-ip'):null)?.split(',')[0].trim()||'';
    const ip=isIP(address);
    const normalized=ip===6&&!address.includes('%')?new URL('http://['+address+']').hostname:ip===4?address:'unattributed';
    return hash(normalized);
}
export async function rateLimitVisitor(req:Request,scope:string,limit:number,seconds:number,globalLimit:number){
    await rateLimit(scope+':visitor:'+visitorRateKey(req),limit,seconds);
    await rateLimit(scope+'-global',globalLimit,seconds);
}
export async function rateLimit(key: string, limit = 20, seconds = 60) {
    await transaction(async()=>{
        const now=Date.now(),sql=db();
        await sql.prepare('DELETE FROM rate_limits WHERE expires<?').run(now);
        await sql.prepare('INSERT INTO rate_limits(key,hits,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET hits=hits+1').run(key,now+seconds*1000);
        const row=await sql.prepare('SELECT hits FROM rate_limits WHERE key=?').get(key);
        if(Number(row?.hits)>limit)throw new HttpError(429,'Too many requests. Please try again later.');
    });
}
export function passwordMatches(password: string, configuredHash = process.env.ADMIN_PASSWORD_HASH || '') {
    const encoded = configuredHash.trim();
    // A malformed deployment secret is a configuration error, not a bad password.
    const match = /^([a-zA-Z0-9_-]{16,128}):([a-f0-9]{128})$/.exec(encoded);
    if (!match) throw new HttpError(503, 'Admin authentication configuration is invalid.');
    if (typeof password !== 'string' || password.length > 256) return false;
    return timingSafeEqual(scryptSync(password, match[1], 64), Buffer.from(match[2], 'hex'));
}
export function cookieValue(req: Request, name: string) { return (req.headers.get('cookie') || '').split(';').map(v => v.trim()).find(v => v.startsWith(name + '='))?.slice(name.length + 1) || ''; }
export async function requireAdmin(req: Request) { const value = cookieValue(req, 'bigk_admin'); if(!value)throw new HttpError(401, 'Sign in to the admin area.'); const session = (await db().prepare('SELECT hash FROM sessions WHERE hash=? AND expires_at>?').get(hash(value), new Date().toISOString())); if (!value || !session)
    throw new HttpError(401, 'Sign in to the admin area.'); }
export function sessionCookie(name: string, value: string, maxAge: number) { return `${name}=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`; }
export function failure(error: unknown) { if (error instanceof HttpError)
    return Response.json({ error: error.message }, { status: error.status, headers: { 'Cache-Control': 'no-store' } }); if (error instanceof SyntaxError)
    return Response.json({ error: 'Invalid request body.' }, { status: 400 }); const code=error&&typeof error==='object'&&'code' in error&&typeof error.code==='string'&&/^[A-Z0-9_]{2,48}$/.test(error.code)?error.code:'UNKNOWN';
const message=error instanceof Error?error.message:'';
const category=/DATABASE_URL must/.test(message)?'DATABASE_URL_MISSING':/DATABASE_PROVIDER|temporary SQLite/.test(message)?'DATABASE_PROVIDER_INVALID':/DATABASE_SCHEMA/.test(message)?'DATABASE_SCHEMA_INVALID':/certificate|self.signed|issuer/i.test(message)?'DATABASE_TLS_TRUST':/Tenant or user not found/.test(message)?'DATABASE_POOLER_TENANT':/password authentication failed/.test(message)?'DATABASE_AUTHENTICATION':code;
console.error('Request failed',error instanceof Error?error.name:'UnknownError',category);
return Response.json({ error: 'Unable to complete this request. Please try again.' }, { status: 500,headers:{'Cache-Control':'no-store'} }); }
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
