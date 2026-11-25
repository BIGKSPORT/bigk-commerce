import {z} from 'zod';
import {db} from '@/lib/db';
import {checkOrigin, body, failure, HttpError, requireAdmin} from '@/lib/security';
import {orderLabelEnabled, readJson, recipientHash, request as myParcelRequest, shipments} from '@/lib/myparcel-orders';
import {tiktokShopReader} from '@/lib/tiktok-shop';
import {tiktokShippingAddress} from '@/lib/tiktok-shipping-address';

export const runtime = 'nodejs';
const numericId = z.string().regex(/^\d{1,24}$/);
const inputSchema = z.object({orderId: numericId}).strict();
const detailSchema = z.object({
 id: numericId,
 status: z.literal('AWAITING_SHIPMENT'),
 shipping_type: z.literal('SELLER'),
 is_buyer_request_cancel: z.boolean().optional(),
 tracking_number: z.string().optional(),
 packages: z.array(z.object({id: numericId})).length(1),
 line_items: z.array(z.object({tracking_number: z.string().optional()})).min(1),
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
  if (!orderLabelEnabled() || process.env.VERCEL_ENV !== 'production') {
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
  const reference = 'BIGK-TIKTOK-' + order.packages[0].id;
  const prior = await myParcelRequest('/shipments?reference_identifier=' + encodeURIComponent(reference) + '&size=100');
  const existing = shipments(await readJson(prior));
  if (!prior.ok || !existing) throw new HttpError(502, 'MyParcel-statuscontrole mislukt. Er is geen zending aangemaakt.');
  const matches = existing.filter((shipment): shipment is Record<string, unknown> => Boolean(shipment && typeof shipment === 'object' && (shipment as Record<string, unknown>).reference_identifier === reference));
  if (matches.length) {
   const [match] = matches;
   const savedAddress = match.recipient as Record<string, unknown> | undefined;
   if (matches.length === 1 && numericId.safeParse(String(match.id)).success && (match.carrier_id ?? match.carrier) === 4 && savedAddress && recipientHash(savedAddress) === recipientHash(recipient)) {
    return Response.json({shipmentId: String(match.id), reference, reused: true});
   }
   throw new HttpError(409, 'Controleer de bestaande MyParcel-zending voor deze referentie.');
  }
  const now = new Date().toISOString();
  const claim = await db().prepare("INSERT INTO shipping_test_attempts(reference,state,updated_at) VALUES(?,'submitting',?) ON CONFLICT(reference) DO NOTHING").run(reference, now);
  if (!claim.changes) throw new HttpError(409, 'Er bestaat al een poging voor dit pakket. Controleer de referentie in MyParcel.');
  try {
   const response = await myParcelRequest('/shipments', {
    method: 'POST',
    headers: {'Content-Type': 'application/vnd.shipment+json;charset=utf-8'},
    body: JSON.stringify({data: {shipments: [{
     carrier: 4, reference_identifier: reference, recipient,
     options: {package_type: 1, delivery_type: 2},
     physical_properties: {weight: 220, length: 22, width: 20, height: 5},
    }]}}),
   });
   const result = z.object({data: z.object({ids: z.array(z.object({id: z.union([numericId, z.number().int().positive()])})).length(1)})}).safeParse(await readJson(response));
   if (!response.ok || !result.success) throw Error('MyParcel did not confirm shipment creation');
   const shipmentId = String(result.data.data.ids[0].id);
   await db().prepare("UPDATE shipping_test_attempts SET state='created',shipment_id=?,updated_at=? WHERE reference=?").run(shipmentId, new Date().toISOString(), reference);
   return Response.json({shipmentId, reference, reused: false});
  } catch {
   await db().prepare("UPDATE shipping_test_attempts SET state='uncertain',updated_at=? WHERE reference=? AND state='submitting'").run(new Date().toISOString(), reference).catch(() => {});
   throw new HttpError(502, 'MyParcel heeft de zending niet bevestigd. Zoek eerst naar ' + reference + ' in MyParcel.');
  }
 } catch (error) {
  return failure(error);
 }
}
