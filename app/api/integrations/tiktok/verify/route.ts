import { createHmac } from 'node:crypto';
import { unseal } from '@/lib/admin-mfa';
import { db } from '@/lib/db';
import { HttpError, requireAdmin } from '@/lib/security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const headers = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' };
const reply = (body: object, status = 200) => Response.json(body, { status, headers });

export async function GET(request: Request) {
  let stage = 'admin session';
  try {
    await requireAdmin(request);
    const appKey = process.env.TIKTOK_SHOP_APP_KEY?.trim();
    const secret = process.env.TIKTOK_SHOP_APP_SECRET?.trim();
    if (!appKey || !secret) return reply({ error: 'TikTok Shop credentials are missing.' }, 503);

    stage = 'read saved authorization';
    const row = await db().prepare('SELECT credentials FROM tiktok_shop_connection WHERE id=?').get('belgium');
    if (typeof row?.credentials !== 'string') return reply({ error: 'No TikTok seller authorization is saved.' }, 404);
    stage = 'decrypt saved authorization';
    const { access_token: accessToken, granted_scopes: grantedScopes } = unseal<{ access_token?: string; granted_scopes?: unknown }>(row.credentials);
    if (!accessToken) return reply({ error: 'The saved TikTok authorization is incomplete.' }, 503);

    const endpoint = new URL('https://open-api.tiktokglobalshop.com/authorization/202309/shops');
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signatureInput = secret + endpoint.pathname + 'app_key' + appKey + 'timestamp' + timestamp + secret;
    endpoint.search = new URLSearchParams({
      app_key: appKey,
      timestamp,
      sign: createHmac('sha256', secret).update(signatureInput).digest('hex'),
    }).toString();

    stage = 'contact TikTok API';
    const response = await fetch(endpoint, {
      headers: { 'content-type': 'application/json', 'x-tts-access-token': accessToken },
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(10000),
    });
    stage = 'read TikTok response';
    const data = await response.json().catch(() => null);
    if (!data) return reply({ error: 'TikTok returned an unreadable response (HTTP '+response.status+').' }, 502);
    if (!response.ok || data.code !== 0 || !Array.isArray(data.data?.shops)) {
      const scopes = Array.isArray(grantedScopes) && grantedScopes.every(scope => typeof scope === 'string')
        ? grantedScopes : null;
      const hasScope = scopes?.some(scope => ['seller.authorization.info', 'seller.fs.order&fufillment.management'].includes(scope));
      const scopeStatus = scopes === null ? 'TikTok did not include a scope list with the saved credentials.'
        : hasScope ? 'The saved credentials report the required shop permission.'
        : 'The saved credentials do not report the required shop permission.';
      const requestId = typeof data.request_id === 'string' && /^[a-zA-Z0-9_-]{1,96}$/.test(data.request_id) ? data.request_id : '';
      return reply({
        error: 'TikTok declined the authorized-shops request (HTTP '+response.status+'). ' + scopeStatus + (requestId ? ' TikTok request ID: ' + requestId + '.' : ''),
        tiktokCode: Number.isInteger(data.code) ? data.code : null,
      }, 502);
    }
    const shops = data.data.shops.map((shop: { id: string; name: string; region: string }) => ({
      id: String(shop.id), name: String(shop.name), region: String(shop.region),
    }));
    const belgianShops = shops.filter((shop: { region: string }) => shop.region === 'BE');
    return reply({ belgianShopFound: belgianShops.length > 0, shops });
  } catch (error) {
    if (error instanceof HttpError && error.status === 401) {
      return reply({ error: 'Sign in to the BIG K back office first.' }, 401);
    }
    return reply({ error: 'TikTok verification failed at: '+stage+'.' }, 502);
  }
}
