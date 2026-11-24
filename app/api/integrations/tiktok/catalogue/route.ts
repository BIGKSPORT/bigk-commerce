import {tiktokShopReader} from '@/lib/tiktok-shop';
import { canonicalGtin, validGtin } from '@/lib/product-identifiers';
import { channelInventory } from '@/lib/channel-inventory';
import { products } from '@/lib/db';
import { HttpError, requireAdmin } from '@/lib/security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const headers = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' };
const reply = (body: object, status = 200) => Response.json(body, { status, headers });

export const maxDuration = 45;

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const {read} = await tiktokShopReader();

    const [{ shops }, master] = await Promise.all([
      read<{ shops: { name: string; region: string; cipher: string }[] }>('/authorization/202309/shops'),
      products().then(items => channelInventory(items, [], new Map())),
    ]);
    const belgian = shops.filter(shop => shop.region === 'BE' && shop.cipher);
    if (belgian.length !== 1) return reply({ error: 'Expected one authorized Belgian shop.' }, 409);
    const shop = belgian[0];
    const query: Record<string,string> = { shop_cipher: shop.cipher, page_size: '10' };
    const pageToken = new URL(request.url).searchParams.get('page');
    if (pageToken && pageToken.length > 2048) return reply({ error: 'Invalid catalogue page.' }, 400);
    if (pageToken) query.page_token = pageToken;
    const page = await read<{ products?: { id: string; title?: string; status?: string }[]; next_page_token?: string; total_count?: number }>(
      '/product/202309/products/search', query, '{}',
    );
    const byEan = new Map(master.filter(variant => variant.eanState === 'ready').map(variant => [variant.canonicalEan, variant]));
    type Detail = { main_images?: { urls?: string[] }[]; video?: { url?: string }; skus?: {
      id: string; seller_sku?: string; identifier_code?: { code?: string };
      sales_attributes?: { value_name?: string }[];
    }[] };
    const listings = await Promise.all((page.products ?? []).map(async ({ id, title, status }) => {
      try {
        const detail = await read<Detail>('/product/202309/products/'+encodeURIComponent(id), { shop_cipher: shop.cipher });
        return {
          id, title, status,
          imageCount: detail.main_images?.length ?? 0, hasVideo: Boolean(detail.video),
          variants: (detail.skus ?? []).map(sku => {
            const ean = sku.identifier_code?.code?.trim() ?? '';
            const match = validGtin(ean) ? byEan.get(canonicalGtin(ean)) : undefined;
            return { id: sku.id, sku: sku.seller_sku, ean,
              options: sku.sales_attributes?.map(attribute => attribute.value_name).filter(Boolean).join(' / '),
              match: match ? { variantId: match.variantId, name: match.name, colour: match.colour, size: match.size } : null };
          }),
        };
      } catch (error) {
        return { id, title, status, detailError: error instanceof HttpError ? error.message : 'Listing details unavailable.' };
      }
    }));
    return reply({ shop: shop.name, total: page.total_count ?? null, nextPage: page.next_page_token ?? '', listings });
  } catch (error) {
    return error instanceof HttpError ? reply({ error: error.message }, error.status)
      : reply({ error: 'Could not read the TikTok catalogue.' }, 502);
  }
}
