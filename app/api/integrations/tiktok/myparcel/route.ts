import {z} from 'zod';
import {db} from '@/lib/db';
import {checkOrigin, body, failure, HttpError, requireAdmin} from '@/lib/security';
import {readJson, request as myParcelRequest, shipments} from '@/lib/myparcel-orders';
import {tiktokShopReader} from '@/lib/tiktok-shop';
import {tiktokShippingAddress} from '@/lib/tiktok-shipping-address';

export const runtime = 'nodejs';
const numericId = z.string().regex(/^\d{1,24}$/);
const orderApi = 'https://order.api.myparcel.nl';
const shopIdSchema = z.string().regex(/^[a-zA-Z0-9_-]{1,50}$/);
const acceptedSchema = z.object({results: z.tuple([z.object({id: z.uuid(), status: z.literal(202)})])});

async function orderRequest(path: '/orders?limit=50' | '/create', payload?: unknown) {
 const key = process.env.MYPARCEL_BE_API_KEY;
 if (!key) throw new HttpError(503, 'MyParcel API-toegang is niet ingesteld.');
 return fetch(orderApi + path, {
  method: payload ? 'POST' : 'GET',
  headers: {
   Authorization: 'bearer ' + Buffer.from(key).toString('base64'),
   'Content-Type': 'application/json;charset=utf-8',
   'User-Agent': 'BIGK-TikTok/1.0',
   Accept: 'application/json',
  },
  body: payload ? JSON.stringify(payload) : undefined,
  cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(12000),
 });
}

async function myParcelShopId() {
 const response = await orderRequest('/orders?limit=50');
 if (!response.ok) throw new HttpError(502, 'MyParcel Order API gaf HTTP ' + response.status + '. Controleer toegang tot MyOrders.');
 const result = z.object({results: z.array(z.object({shopId: shopIdSchema}))}).safeParse(await readJson(response));
 if (!result.success) throw new HttpError(502, 'MyParcel Order API gaf geen herkenbaar orderoverzicht terug.');
 const configured = shopIdSchema.safeParse(process.env.MYPARCEL_BE_ORDER_SHOP_ID);
 if (configured.success) return configured.data;
 const ids = [...new Set(result.data.results.map(item => item.shopId))];
 if (ids.length !== 1) throw new HttpError(409, 'Stel het ID van de Belgische winkel in voor MyParcel MyOrders.');
 return ids[0];
}

const inputSchema = z.object({orderId: numericId}).strict();
const detailSchema = z.object({
 id: numericId,
 status: z.literal('AWAITING_SHIPMENT'),
 shipping_type: z.literal('SELLER'),
 is_buyer_request_cancel: z.boolean().optional(),
 tracking_number: z.string().optional(),
 packages: z.array(z.object({id: numericId})).length(1),
 create_time: z.number().int().positive().max(4102444800),
 line_items: z.array(z.object({product_name: z.string().trim().min(1), seller_sku: z.string().trim().optional(), tracking_number: z.string().optional()})).min(1).max(100),
 recipient_address: z.object({
  region_code: z.enum(['BE', 'NL']),
  name: z.string().trim().min(1).max(100),
  postal_code: z.string().trim().min(4).max(10),
  address_line1: z.string().trim().min(1).max(120),
  address_line2: z.string().trim().optional(),
  address_line3: z.string().trim().optional(),
  address_line4: z.string().trim().optional(),
  district_info: z.array(z.object({address_level: z.string(), address_level_name: z.string().trim().optional(), address_name: z.string().trim().min(1).max(100)})),
 }),
});

export async function POST(req: Request) {
 try {
  checkOrigin(req);
  await requireAdmin(req);
  if (process.env.VERCEL_ENV !== 'production') {
   throw new HttpError(403, 'MyParcel-zendingen zijn alleen beschikbaar in de live backoffice.');
  }
  const input = inputSchema.safeParse(await body(req));
  if (!input.success) throw new HttpError(400, 'Ongeldig TikTok-bestelnummer.');
  const {orderId} = input.data;
  const {read} = await tiktokShopReader();
  const {shops} = await read<{shops: {region: string; cipher: string}[]}>('/authorization/202309/shops');
  const belgian = shops.filter(shop => shop.region === 'BE' && shop.cipher);
  if (belgian.length !== 1) throw new HttpError(409, 'Verbind precies één Belgische TikTok Shop.');
  const {orders} = await read<{orders: unknown[]}>('/order/202309/orders', {ids: orderId, shop_cipher: belgian[0].cipher});
  const check = detailSchema.safeParse(orders?.[0]);
  if (orders?.length !== 1 || !check.success || check.data.id !== orderId) {
   throw new HttpError(409, 'TikTok moet één Seller Shipping-pakket met een volledig Belgisch of Nederlands adres teruggeven.');
  }
  const order = check.data;
  if (order.is_buyer_request_cancel || order.tracking_number || order.line_items.some(item => item.tracking_number)) {
   throw new HttpError(409, 'TikTok meldt bestaande tracking of een annuleringsaanvraag.');
  }
  const recipient = tiktokShippingAddress(order.recipient_address);
  const shipmentReference = 'BIGK-TIKTOK-' + order.packages[0].id;
  const prior = await myParcelRequest('/shipments?reference_identifier=' + encodeURIComponent(shipmentReference) + '&size=100');
  const existing = shipments(await readJson(prior));
  if (!prior.ok || !existing) throw new HttpError(502, 'MyParcel-zendingen konden niet worden gecontroleerd.');
  if (existing.some(item => item && typeof item === 'object' && (item as Record<string, unknown>).reference_identifier === shipmentReference)) {
   throw new HttpError(409, 'Er bestaat al een MyParcel-zending voor dit pakket.');
  }

  const shopId = await myParcelShopId();
  const reference = 'BIGK-TIKTOK-ORDER-' + orderId;
  const known = await db().prepare('SELECT shipment_id FROM shipping_test_attempts WHERE reference=?').get(reference);
  if (typeof known?.shipment_id === 'string' && z.uuid().safeParse(known.shipment_id).success) {
   return Response.json({myParcelOrderId: known.shipment_id, reference, reused: true});
  }
  const claim = await db().prepare("INSERT INTO shipping_test_attempts(reference,state,updated_at) VALUES(?,'submitting',?) ON CONFLICT(reference) DO NOTHING").run(reference, new Date().toISOString());
  if (!claim.changes) throw new HttpError(409, 'Er is al een importpoging voor deze order. Controleer MyOrders op ' + reference + '.');

  try {
   const response = await orderRequest('/create', [{
    shopId,
    sourceId: reference,
    customerReference: reference,
    orderedAt: new Date(order.create_time * 1000).toISOString(),
    lines: order.line_items.map(item => ({quantity: 1, product: {name: item.product_name, ...(item.seller_sku ? {sku: item.seller_sku} : {})}})),
    shipping: {
     recipient: {
      address: {countryCode: recipient.cc, postalCode: recipient.postal_code, city: recipient.city, street: recipient.street, houseNumber: recipient.number, ...(recipient.box_number ? {boxNumber: recipient.box_number} : {})},
      contact: {type: 'PRIVATE', name: recipient.person},
     },
    },
   }]);
   const raw = await readJson(response).catch(() => null);
   const result = acceptedSchema.safeParse(raw);
   if (response.status !== 202 || !result.success) {
    const status = z.object({results: z.tuple([z.object({status: z.number().int()})])}).safeParse(raw);
    throw new HttpError(502, 'MyParcel bevestigde de orderimport niet (HTTP ' + response.status + (status.success ? ', orderstatus ' + status.data.results[0].status : '') + ').');
   }
   const myParcelOrderId = result.data.results[0].id;
   await db().prepare("UPDATE shipping_test_attempts SET state='accepted',shipment_id=?,updated_at=? WHERE reference=?").run(myParcelOrderId, new Date().toISOString(), reference);
   return Response.json({myParcelOrderId, reference, reused: false}, {status: 202});
  } catch (error) {
   await db().prepare("UPDATE shipping_test_attempts SET state='uncertain',updated_at=? WHERE reference=? AND state='submitting'").run(new Date().toISOString(), reference).catch(() => {});
   if (error instanceof HttpError) throw error;
   throw new HttpError(502, 'MyParcel heeft de orderimport niet bevestigd. Zoek eerst naar ' + reference + ' in MyOrders.');
  }
 } catch (error) {
  return failure(error);
 }
}
