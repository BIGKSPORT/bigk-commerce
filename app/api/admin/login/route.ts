import {mfaRequired,checkSecondFactor,adminSessionHash} from '@/lib/admin-mfa';
import {adminPasswordHash} from '@/lib/admin-access';
import { db, audit, transaction } from '@/lib/db';
import { body, checkOrigin, failure, HttpError, hash, token, rateLimit, rateLimitVisitor, passwordMatches, sessionCookie } from '@/lib/security';
export const runtime = 'nodejs';
export async function POST(req: Request) { try {
    checkOrigin(req);
    await rateLimitVisitor(req,'admin-login',6,300,1000);
    const configuredHash=await adminPasswordHash();
    if (!configuredHash)
        throw new HttpError(503, 'Admin access is not configured.');
    const data = await body(req);
    if (!data || typeof data.password !== 'string' || data.password.length > 256 || !passwordMatches(data.password,configuredHash))
        throw new HttpError(401, mfaRequired()?'Incorrect password or authenticator code.':'Incorrect password.');
    const value = token();
    await transaction(async()=>{if(mfaRequired()){if(typeof data.code!=='string'||data.code.length>100)throw new HttpError(401,'Enter your authenticator code.');await checkSecondFactor(data.code.trim())}
    (await db().prepare('DELETE FROM sessions WHERE expires_at<?').run(new Date().toISOString()));
    (await db().prepare('INSERT INTO sessions(hash,expires_at) VALUES(?,?)').run(adminSessionHash(value), new Date(Date.now() + 8 * 60 * 60000).toISOString()));
    (await audit('admin.login', 'admin'));});
    return Response.json({ ok: true }, { headers: { 'Set-Cookie': sessionCookie('bigk_admin', value, 8 * 3600), 'Cache-Control': 'no-store' } });
}
catch (e) {
    return failure(e);
} }
