import {z} from 'zod';
import {checkOrigin, body, failure, HttpError, requireAdmin} from '@/lib/security';
import {tiktokShopReader} from '@/lib/tiktok-shop';
import {tiktokShippingAddress} from '@/lib/tiktok-shipping-address';

export const runtime = 'nodejs';
const numericId = z.string().regex(/^\d{1,24}$/);
const inputSchema = z.object({orderIds: z.array(numericId).min(1).max(20), weightGrams: z.number().int().min(1).max(20000)}).strict();
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
  const parsed = z.array(detailSchema).safeParse(orders);
  if (!parsed.success || parsed.data.length !== unique.size || new Set(parsed.data.map(order => order.id)).size !== unique.size || parsed.data.some(order => !unique.has(order.id))) {
   throw new HttpError(409, 'TikTok moet per bestelling één Seller Shipping-pakket met een volledig Belgisch of Nederlands adres teruggeven.');
  }
  const rows = parsed.data.map(order => {
   if (order.is_buyer_request_cancel || order.tracking_number || order.line_items.some(item => item.tracking_number)) {
    throw new HttpError(409, 'TikTok meldt bestaande tracking of een annuleringsaanvraag voor ' + order.id + '.');
   }
   const recipient = tiktokShippingAddress(order.recipient_address);
   return [
    recipient.person, '', recipient.postal_code, recipient.number, recipient.box_number || '',
    recipient.street, '', recipient.city, '', '', 'BIGK-TIKTOK-' + order.packages[0].id, '',
    recipient.cc, '', '', '', weightGrams + 'g', '',
   ].map(csvCell).join(';');
  });
  return new Response('\uFEFF' + [header, ...rows].join('\r\n') + '\r\n', {
   headers: {'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="bigk-tiktok-myparcel.csv"', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff'},
  });
 } catch (error) {
  return failure(error);
 }
}
