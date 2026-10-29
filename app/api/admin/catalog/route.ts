import { z } from 'zod';
import { audit, db, products, transaction } from '@/lib/db';
import { expireReservations } from '@/lib/commerce';
import { body, checkOrigin, failure, HttpError, requireAdmin } from '@/lib/security';
export const runtime = 'nodejs';
export async function GET(req: Request) { try {
    (await requireAdmin(req));
    (await expireReservations());
    return Response.json({ products: (await products()) }, { headers: { 'Cache-Control': 'no-store' } });
}
catch (e) {
    return failure(e);
} }
const schema = z.object({ version: z.number().int().min(0), id: z.string().max(100), priceCents: z.number().int().min(1).max(1000000).nullable(), approved: z.boolean(), active: z.boolean(), variants: z.array(z.object({ id: z.string().max(100), stock: z.number().int().min(0).max(100000) }).strict()).max(30) }).strict();
export async function PATCH(req: Request) { try {
    checkOrigin(req);
    (await requireAdmin(req));
    const parsed = schema.safeParse(await body(req));
    if (!parsed.success)
        throw new HttpError(400, 'Invalid product values.');
    const data = parsed.data;
    (await transaction(async () => { const p = (await products()).find(p => p.id === data.id); if (!p)
        throw new HttpError(404, 'Product not found.'); if (p.version !== data.version)
        throw new HttpError(409, 'This product changed in another session. Refresh before saving.'); if (data.active && (!data.approved || !data.priceCents || !p.images.length))
        throw new HttpError(409, 'Active products need approved pricing and product photos.'); if (data.variants.length !== p.variants.length || new Set(data.variants.map(v => v.id)).size !== p.variants.length)
        throw new HttpError(400, 'Supply each variant exactly once.'); for (const v of data.variants) {
        const current = p.variants.find(x => x.id === v.id);
        if (!current || v.stock < current.reserved)
            throw new HttpError(409, 'Stock cannot be below reserved units.');
        (await db().prepare('UPDATE variants SET stock=? WHERE id=? AND product_id=?').run(v.stock, v.id, p.id));
    } (await db().prepare('UPDATE products SET price_cents=?,approved=?,active=?,version=version+1 WHERE id=?').run(data.priceCents, data.approved ? 1 : 0, data.active ? 1 : 0, p.id)); (await audit('catalog.updated', p.id)); }));
    return Response.json({ ok: true });
}
catch (e) {
    return failure(e);
} }
