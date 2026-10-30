import {z} from 'zod';
import {dpdPreflight} from '@/lib/dpd-preflight';
import {body,checkOrigin,requireAdmin,rateLimit,failure,HttpError} from '@/lib/security';

export const runtime='nodejs';
const draft = z.object({
  destinationCountry:z.string().min(2).max(2),
  destinationCity:z.string().max(150),
  recipientName:z.string().max(150),
  recipientAddress:z.string().max(250),
  recipientPostalCode:z.string().max(30),
  recipientEmail:z.string().max(254).optional(),
  recipientPhone:z.string().max(40).optional(),
  parcelGrossGrams:z.number().int().positive().nullable(),
  exporterEori:z.string().max(50).optional(),
  invoiceNumber:z.string().max(100).optional(),
  invoiceCurrency:z.string().max(3).optional(),
  invoiceIncoterm:z.string().max(50).optional(),
  invoiceDocumentReady:z.boolean().optional(),
  items:z.array(z.object({
    sku:z.string().max(100),description:z.string().max(500),
    quantity:z.number().int(),unitValueCents:z.number().int(),
    commodityCode:z.string().max(20).optional(),
    originCountry:z.string().max(2).optional(),
    unitNetGrams:z.number().int().optional(),
  }).strict()).min(1).max(50),
}).strict();

/** Readiness check only: cannot buy labels, print labels or invoke DPD. */
export async function POST(req:Request) {
  try {
    checkOrigin(req);
    await requireAdmin(req);
    await rateLimit('admin-dpd-preflight',30,300);
    const parsed=draft.safeParse(await body(req));
    if(!parsed.success)throw new HttpError(400,'Invalid shipment draft.');
    return Response.json(dpdPreflight(parsed.data),{headers:{'Cache-Control':'no-store'}});
  } catch(e) {return failure(e)}
}
