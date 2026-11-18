import { createHmac } from 'node:crypto';
import { unseal } from '@/lib/admin-mfa';
import { db } from '@/lib/db';
import { HttpError, requireAdmin } from '@/lib/security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const headers = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' };
const reply = (body: object, status = 200) => Response.json(body, { status, headers });

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const appKey = process.env.TIKTOK_SHOP_APP_KEY?.trim();
    const secret = process.env.TIKTOK_SHOP_APP_SECRET?.trim();
    if (!appKey || !secret) return reply({ error: 'TikTok Shop credentials are missing.' }, 503);

    const row = await db().prepare('SELECT credentials FROM tiktok_shop_connection WHERE id=?').get('belgium');
    if (typeof row?.credentials !== 'string') return reply({ error: 'No TikTok seller authorization is saved.' }, 404);
    const { access_token: accessToken } = unseal<{ access_token?: string }>(row.credentials);
    if (!accessToken) return reply({ error: 'The saved TikTok authorization is incomplete.' }, 503);

    const endpoint = new URL('https://open-api.tiktokglobalshop.com/authorization/202309/shops');
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signatureInput = secret + endpoint.pathname + 'app_key' + appKey + 'timestamp' + timestamp + secret;
    endpoint.search = new URLSearchParams({
      app_key: appKey,
      timestamp,
      sign: createHmac('sha256', secret).update(signatureInput).digest('hex'),
    }).toString();

    const response = await fetch(endpoint, {
      headers: { 'content-type': 'application/json', 'x-tts-access-token': accessToken },
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(10000),
    });
    const data = await response.json();
    if (!response.ok || data.code !== 0 || !Array.isArray(data.data?.shops)) {
      return reply({
        error: 'TikTok could not verify the authorized shops. Check Shop Authorized Information permissions and seller authorization.',
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
    return reply({ error: 'Could not verify the TikTok Shop connection.' }, 502);
  }
}
