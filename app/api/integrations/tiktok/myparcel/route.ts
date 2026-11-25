import {z} from 'zod';
import {checkOrigin, body, failure, HttpError, requireAdmin} from '@/lib/security';
import {tiktokShopReader} from '@/lib/tiktok-shop';
import {tiktokShippingAddress} from '@/lib/tiktok-shipping-address';

export const runtime = 'nodejs';
const numericId = z.string().regex(/^\d{1,24}$/);
const inputSchema = z.object({orderIds: z.array(numericId).min(1).max(20), weightGrams: z.number().int().min(1).max(20000).optional()}).strict();
const detailSchema = z.object({
 id: numericId,
 status: z.literal('AWAITING_SHIPMENT'),
 shipping_type: z.literal('SELLER'),
 is_buyer_request_cancel: z.boolean().optional(),
 tracking_number: z.string().optional(),
 packages: z.array(z.object({id: numericId})).length(1),
 line_items: z.array(z.object({tracking_number: z.string().optional()})).min(1).max(100),
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


const header = 'Naam;Bedrijf;Postcode;Huisnummer;Toevoeging;Straat;Straat extra;Plaats;Email;Vervoerder;Eigen kenmerk;Telefoonnummer;Land;Afhaalnummer;Afhaalstraat;Afhaalpostcode;gewicht;';

function csvCell(value: string) {
 if (/^[\s]*[=+@-]|[\u0000-\u001f\u007f]/u.test(value)) throw new HttpError(409, 'Een TikTok-adres bevat tekens die MyParcel niet veilig kan importeren.');
 return /[;"]/.test(value) ? '"' + value.replaceAll('"', '""') + '"' : value;
}

export async function POST(req: Request) {
 try {
  checkOrigin(req);
  await requireAdmin(req);
  const input = inputSchema.safeParse(await body(req));
  if (!input.success) throw new HttpError(400, 'Ongeldige TikTok-bestelnummers of pakketgewicht.');
  const {orderIds, weightGrams} = input.data;
  const unique = new Set(orderIds);
  if (unique.size !== orderIds.length) throw new HttpError(400, 'Een TikTok-bestelling komt meermaals voor.');
  const {read} = await tiktokShopReader();
  const {shops} = await read<{shops: {region: string; cipher: string}[]}>('/authorization/202309/shops');
  const belgian = shops.filter(shop => shop.region === 'BE' && shop.cipher);
  if (belgian.length !== 1) throw new HttpError(409, 'Verbind precies één Belgische TikTok Shop.');
  const {orders} = await read<{orders: unknown[]}>('/order/202309/orders', {ids: orderIds.join(','), shop_cipher: belgian[0].cipher});
  if (!Array.isArray(orders)) throw new HttpError(502, 'TikTok gaf geen herkenbaar besteloverzicht terug.');
  const rows: string[] = [];
  const skipped: string[] = [];
  const candidates = z.object({id: numericId}).passthrough();
  const byId = new Map<string, unknown>();
  for (const candidate of orders) {
   const identified = candidates.safeParse(candidate);
   if (!identified.success || !unique.has(identified.data.id)) continue;
   const id = identified.data.id;
   byId.set(id, byId.has(id) ? null : candidate);
  }
  for (const id of orderIds) {
   const parsed = detailSchema.safeParse(byId.get(id));
   if (!parsed.success || parsed.data.is_buyer_request_cancel || parsed.data.tracking_number || parsed.data.line_items.some(item => item.tracking_number)) {
    skipped.push(id);
    continue;
   }
   const order = parsed.data;
   try {
    const recipient = tiktokShippingAddress(order.recipient_address);
    rows.push([
     recipient.person, '', recipient.postal_code, recipient.number, recipient.box_number || '',
     recipient.street, '', recipient.city, '', '', 'BIGK-TIKTOK-' + order.packages[0].id, '',
     recipient.cc, '', '', '', weightGrams === undefined ? '' : weightGrams + 'g', '',
    ].map(csvCell).join(';'));
   } catch (error) {
    if (!(error instanceof HttpError)) throw error;
    if (orderIds.length === 1) throw error;
    skipped.push(id);
   }
  }
  if (!rows.length) throw new HttpError(409, 'Geen exporteerbare orders. Controleer deze TikTok-orders: ' + skipped.join(', '));
  return new Response('\uFEFF' + [header, ...rows].join('\r\n') + '\r\n', {
   headers: {'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="bigk-tiktok-myparcel.csv"', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'X-Bigk-Skipped-Orders': skipped.join(',')},
  });
 } catch (error) {
  return failure(error);
 }
}
