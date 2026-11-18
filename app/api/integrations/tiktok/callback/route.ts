import { NextResponse } from 'next/server';
import { adminSessionHash, seal, unseal } from '@/lib/admin-mfa';
import { db } from '@/lib/db';
import { cookieValue, HttpError, requireAdmin, token } from '@/lib/security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const path = '/api/integrations/tiktok/callback';
const stateCookie = 'bigk_tiktok_pending';
const tokenUrl = 'https://auth.tiktok-shops.com/api/v2/token/get';
const responseHeaders = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' };
const message = (text: string, status: number) => new Response(text, { status, headers: responseHeaders });
type Pending = { state: string; admin: string; expires: number };

export async function GET(request: Request) {
  const url = new URL(request.url);
  const admin = cookieValue(request, 'bigk_admin');
  // A cross-site redirect may suppress the Strict admin cookie. The pending
  // cookie is issued only after admin authentication and expires in ten minutes.
  const appKey = process.env.TIKTOK_SHOP_APP_KEY?.trim();
  const appSecret = process.env.TIKTOK_SHOP_APP_SECRET?.trim();

  if (url.searchParams.get('start') === '1') {
    try {
      await requireAdmin(request);
      const configuredUrl = process.env.TIKTOK_SHOP_AUTHORIZATION_URL?.trim();
      if (!appKey || !appSecret || !configuredUrl) {
        return message('TikTok Shop authorization is waiting for server configuration.', 503);
      }
      const destination = new URL(configuredUrl);
      if (destination.protocol !== 'https:' ||
          !['services.tiktokshop.com', 'services.tiktok-shops.com', 'auth.tiktok-shops.com'].includes(destination.hostname) ||
          destination.username || destination.password || destination.port) {
        return message('TikTok Shop authorization URL is invalid.', 503);
      }
      const state = token();
      destination.searchParams.set('state', state);
      const response = NextResponse.redirect(destination, { status: 303, headers: responseHeaders });
      const pending = seal({ state, admin: adminSessionHash(admin), expires: Date.now() + 600_000 });
      response.cookies.set(stateCookie, pending, { httpOnly: true, secure: true, sameSite: 'lax', path, maxAge: 600 });
      return response;
    } catch (error) {
      if (error instanceof HttpError && error.status === 401) return message('Sign in to the BIG K back office first.', 401);
      return message('Could not start TikTok Shop authorization.', 503);
    }
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const pendingCookie = cookieValue(request, stateCookie);
  if (!code || code.length > 2048 || !state || !pendingCookie) {
    return message('Start TikTok Shop authorization from BIG K in this browser.', 400);
  }
  if (!appKey || !appSecret) return message('TikTok Shop authorization is waiting for server configuration.', 503);

  function finish(text: string, status: number) {
    const response = new NextResponse(text, { status, headers: responseHeaders });
    response.cookies.set(stateCookie, '', { httpOnly: true, secure: true, sameSite: 'lax', path, maxAge: 0 });
    return response;
  }

  let pending: Pending;
  try {
    pending = unseal<Pending>(pendingCookie);
    if (pending.state !== state || pending.expires <= Date.now() || (admin && adminSessionHash(admin) !== pending.admin)) {
      return finish('This TikTok authorization attempt is invalid or expired.', 400);
    }
  } catch {
    return finish('This TikTok authorization attempt is invalid or expired.', 400);
  }

  try {
    // Require the original admin session to still exist. Its database hash
    // is bound to the pending cookie when authorization starts.
    const session = await db().prepare('SELECT hash FROM sessions WHERE hash=? AND expires_at>?')
      .get(pending.admin, new Date().toISOString());
    if (!session || (admin && adminSessionHash(admin) !== pending.admin)) return finish('Sign in to BIG K and start authorization again.', 401);

    const endpoint = new URL(tokenUrl);
    endpoint.search = new URLSearchParams({ app_key: appKey, app_secret: appSecret, auth_code: code, grant_type: 'authorized_code' }).toString();
    const result = await fetch(endpoint, { cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000) });
    if (!result.ok) return finish('TikTok did not accept the authorization code. Start again from BIG K.', 502);
    const { code: resultCode, data } = await result.json();
    if (resultCode !== 0 || typeof data?.access_token !== 'string' || typeof data?.refresh_token !== 'string' || data.user_type !== 0) {
      return finish('TikTok did not return seller credentials. Start again from BIG K.', 502);
    }

    const sql = db();
    await sql.prepare('CREATE TABLE IF NOT EXISTS tiktok_shop_connection (id TEXT PRIMARY KEY, credentials TEXT NOT NULL, updated_at TEXT NOT NULL)').run();
    await sql.prepare('INSERT INTO tiktok_shop_connection (id, credentials, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET credentials=excluded.credentials, updated_at=excluded.updated_at')
      .run('belgium', seal(data), new Date().toISOString());
    return finish('TikTok seller authorization saved. BIG K can now verify the authorized shop.', 200);
  } catch {
    return finish('Could not save TikTok Shop authorization. Start again from BIG K.', 502);
  }
}
