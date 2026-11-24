import {createHmac} from 'node:crypto';
import {unseal} from './admin-mfa';
import {db} from './db';
import {HttpError} from './security';

export async function tiktokShopReader() {
  const appKey = process.env.TIKTOK_SHOP_APP_KEY?.trim();
  const secret = process.env.TIKTOK_SHOP_APP_SECRET?.trim();
  if (!appKey || !secret) throw new HttpError(503, 'TikTok Shop is not configured.');
  const row = await db().prepare('SELECT credentials FROM tiktok_shop_connection WHERE id=?').get('belgium');
  if (typeof row?.credentials !== 'string') throw new HttpError(404, 'Connect the Belgian TikTok Shop first.');
  const { access_token: accessToken } = unseal<{ access_token?: string }>(row.credentials);
  if (!accessToken) throw new HttpError(503, 'TikTok Shop authorization is incomplete.');

  const read = async <T>(path: string, query: Record<string,string> = {}, body?: string): Promise<T> => {
    const url = new URL(path, 'https://open-api.tiktokglobalshop.com');
    const params: Record<string,string> = { ...query, app_key: appKey, timestamp: String(Math.floor(Date.now() / 1000)) };
    const sorted = Object.keys(params).sort().map(key => key + params[key]).join('');
    params.sign = createHmac('sha256', secret).update(secret + path + sorted + (body ?? '') + secret).digest('hex');
    url.search = new URLSearchParams(params).toString();
    const response = await fetch(url, {
      method: body === undefined ? 'GET' : 'POST', body,
      headers: { 'content-type': 'application/json', 'x-tts-access-token': accessToken },
      cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(8000),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || result?.code !== 0 || !result.data) {
      throw new HttpError(502, 'TikTok returned HTTP '+response.status+(Number.isInteger(result?.code) ? ' / code '+result.code : '')+'.');
    }
    return result.data as T;
  };
  return read;
}
