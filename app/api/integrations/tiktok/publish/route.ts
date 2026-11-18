import { createHmac } from 'node:crypto';
import { z } from 'zod';
import { unseal } from '@/lib/admin-mfa';
import { canonicalGtin, validGtin } from '@/lib/product-identifiers';
import { channelInventory } from '@/lib/channel-inventory';
import { db, products } from '@/lib/db';
import { boundedText, checkOrigin, HttpError, requireAdmin } from '@/lib/security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const headers = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' };
const reply = (body: object, status = 200) => Response.json(body, { status, headers });

export const maxDuration = 45;

const schema = z.object({
  productId: z.string().min(1).max(100),
  listingId: z.string().regex(/^\d{1,40}$/),
  currentTitle: z.string().max(1024),
  title: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().min(1).max(6000).optional(),
}).strict().refine(value => value.title !== undefined || value.description !== undefined);

const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    checkOrigin(request);
    const input = schema.safeParse(await boundedText(request, 24000).then(JSON.parse).catch(() => null));
    if (!input.success) return reply({ error: 'Enter a valid title or description and confirm the TikTok listing.' }, 400);
    const { productId, listingId, currentTitle, title, description } = input.data;
    const appKey = process.env.TIKTOK_SHOP_APP_KEY?.trim();
    const secret = process.env.TIKTOK_SHOP_APP_SECRET?.trim();
    if (!appKey || !secret) return reply({ error: 'TikTok Shop is not configured.' }, 503);
    const row = await db().prepare('SELECT credentials FROM tiktok_shop_connection WHERE id=?').get('belgium');
    if (typeof row?.credentials !== 'string') return reply({ error: 'Connect the Belgian TikTok Shop first.' }, 404);
    const { access_token: accessToken } = unseal<{ access_token?: string }>(row.credentials);
    if (!accessToken) return reply({ error: 'TikTok Shop authorization is incomplete.' }, 503);

    async function read<T>(path: string, query: Record<string,string> = {}, body?: string): Promise<T> {
      const url = new URL(path, 'https://open-api.tiktokglobalshop.com');
      const params: Record<string,string> = { ...query, app_key: appKey!, timestamp: String(Math.floor(Date.now() / 1000)) };
      const sorted = Object.keys(params).sort().map(key => key + params[key]).join('');
      params.sign = createHmac('sha256', secret!).update(secret + path + sorted + (body ?? '') + secret).digest('hex');
      url.search = new URLSearchParams(params).toString();
      const response = await fetch(url, {
        method: body === undefined ? 'GET' : 'POST', body,
        headers: { 'content-type': 'application/json', 'x-tts-access-token': accessToken! },
        cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(8000),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.code !== 0 || (body === undefined && !result.data)) {
        throw new HttpError(502, 'TikTok returned HTTP '+response.status+(Number.isInteger(result?.code) ? ' / code '+result.code : '')+'.');
      }
      return result.data as T;
    }

    const [{ shops }, master] = await Promise.all([
      read<{ shops: { region: string; cipher: string }[] }>('/authorization/202309/shops'),
      products().then(items => channelInventory(items, [], new Map())),
    ]);
    const belgian = shops.filter(shop => shop.region === 'BE' && shop.cipher);
    if (belgian.length !== 1) return reply({ error: 'Expected one authorized Belgian shop.' }, 409);
    const params = { shop_cipher: belgian[0].cipher };
    const path = '/product/202309/products/' + listingId;
    const listing = await read<{ title?: string; skus?: { identifier_code?: { code?: string } }[] }>(path, params);
    if (listing.title !== currentTitle) return reply({ error: 'The TikTok title changed. Reload the listing before submitting.' }, 409);

    const verified = new Set(master.filter(variant => variant.productId === productId && variant.eanState === 'ready')
      .map(variant => variant.canonicalEan));
    const listingCodes = (listing.skus ?? []).map(sku => sku.identifier_code?.code?.trim() ?? '');
    if (!listingCodes.length || new Set(listingCodes.map(canonicalGtin)).size !== listingCodes.length ||
      listingCodes.some(code => !validGtin(code) || !verified.has(canonicalGtin(code)))) {
      return reply({ error: 'Every TikTok variant must match a distinct verified EAN on this BIG K product before publishing.' }, 409);
    }

    const changes: Record<string, string> = {};
    if (title && title !== currentTitle) changes.title = title;
    if (description) changes.description = '<p>' + escapeHtml(description).replace(/\r?\n/g, '<br>') + '</p>';
    if (!Object.keys(changes).length) return reply({ error: 'There are no changes to submit.' }, 400);

    await read<unknown>(path + '/partial_edit', params, JSON.stringify(changes));
    return reply({ status: 'submitted', message: 'TikTok accepted the update. Check Seller Centre for review and publication status.' });
  } catch (error) {
    return error instanceof HttpError ? reply({ error: error.message }, error.status)
      : reply({ error: 'TikTok update could not be confirmed. Check Seller Centre before retrying.' }, 502);
  }
}
