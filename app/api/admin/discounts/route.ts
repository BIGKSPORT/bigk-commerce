import { listDiscountCodes, upsertDiscountCode, setDiscountActive, discountCodeSchema } from '@/lib/discounts';
import { requireAdmin, failure, checkOrigin, body } from '@/lib/security';
import { audit } from '@/lib/db';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    return Response.json({ codes: await listDiscountCodes() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return failure(e);
  }
}

export async function POST(req: Request) {
  try {
    checkOrigin(req);
    await requireAdmin(req);
    const parsed = discountCodeSchema.safeParse(await body(req));
    if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message || 'Invalid discount' }, { status: 400 });
    const code = await upsertDiscountCode(parsed.data);
    await audit('discount.saved', code);
    return Response.json({ ok: true, code });
  } catch (e) {
    return failure(e);
  }
}

export async function PATCH(req: Request) {
  try {
    checkOrigin(req);
    await requireAdmin(req);
    const data = await body(req);
    const code = String(data.code || '');
    const active = Boolean(data.active);
    await setDiscountActive(code, active);
    await audit(active ? 'discount.activated' : 'discount.deactivated', code.toUpperCase());
    return Response.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
