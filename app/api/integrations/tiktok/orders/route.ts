import {HttpError, requireAdmin} from '@/lib/security';
import {TikTokApiError, tiktokShopReader} from '@/lib/tiktok-shop';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const headers = {'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer'};
const reply = (body: object, status = 200) => Response.json(body, {status, headers});

type TikTokOrder = {
  id: string;
  status: string;
  shipping_type?: string;
  rts_sla_time?: number;
  is_buyer_request_cancel?: boolean;
  line_items?: {id: string; product_name?: string; seller_sku?: string; sku_name?: string}[];
};

export async function GET(request: Request) {
  let stage: 'shop' | 'orders' = 'shop';
  let scopes: string[] | null = null;
  try {
    await requireAdmin(request);
    const cursor = new URL(request.url).searchParams.get('page');
    if (cursor && cursor.length > 2048) throw new HttpError(400, 'Ongeldige TikTok-pagina.');

    const {read, grantedScopes} = await tiktokShopReader();
    scopes = grantedScopes;
    const {shops} = await read<{shops: {name: string; region: string; cipher: string}[]}>('/authorization/202309/shops');
    const belgian = shops.filter(shop => shop.region === 'BE' && shop.cipher);
    if (belgian.length !== 1) throw new HttpError(409, 'Verbind precies één Belgische TikTok Shop.');
    const shop = belgian[0];
    stage = 'orders';
    const {orders, next_page_token} = await read<{orders?: TikTokOrder[]; next_page_token?: string}>(
      '/order/202309/orders/search',
      {shop_cipher: shop.cipher, page_size: '20', ...(cursor ? {page_token: cursor} : {})},
      JSON.stringify({order_status: 'AWAITING_SHIPMENT'}),
    );

    return reply({
      shop: shop.name,
      nextPage: next_page_token ?? '',
      orders: (orders ?? []).map(order => ({
        id: order.id,
        status: order.status,
        shippingType: order.shipping_type ?? null,
        dispatchDeadline: order.rts_sla_time ?? null,
        cancellationRequested: order.is_buyer_request_cancel === true,
        items: (order.line_items ?? []).map(item => ({
          id: item.id,
          name: item.product_name ?? null,
          sku: item.seller_sku ?? null,
          variant: item.sku_name ?? null,
        })),
      })),
    });
  } catch (error) {
    if (error instanceof TikTokApiError) {
      const label = stage === 'orders' ? 'Bestellingen ophalen' : 'Belgische shop opzoeken';
      const required = stage === 'orders' ? 'seller.order.info' : 'seller.authorization.info';
      const hasScope = scopes?.some(scope => scope === required || scope === 'seller.fs.order&fufillment.management');
      const permission = scopes === null ? 'TikTok gaf geen rechtenlijst mee bij de opgeslagen toestemming.'
        : hasScope ? 'Het opgeslagen token vermeldt een geschikt recht.'
        : 'Het opgeslagen token vermeldt het vereiste recht niet.';
      return reply({error: [
        label + ' mislukt. ' + error.message,
        error.code === 105005 ? permission : '',
        error.requestId ? 'TikTok-request-ID: ' + error.requestId : '',
      ].filter(Boolean).join(' ')}, error.status);
    }
    return error instanceof HttpError ? reply({error: error.message}, error.status)
      : reply({error: 'TikTok-bestellingen konden niet worden opgehaald.'}, 502);
  }
}
