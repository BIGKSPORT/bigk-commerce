import { db } from './database';
import type { Product } from './types';
export { db, transaction, closeDatabase } from './database';
export async function products(): Promise<Product[]> {
  const sql = db();
  const rows = await sql.prepare('SELECT * FROM products ORDER BY featured DESC,rowid').all();
  const contents=await sql.prepare('SELECT * FROM product_content').all();
  const contentById=new Map(contents.map(c=>[String(c.product_id),c.content]));
  const variants = await sql.prepare('SELECT * FROM variants ORDER BY rowid').all();
  return rows.map(p => ({
    content:contentById.has(String(p.id))?JSON.parse(String(contentById.get(String(p.id)))):undefined,version: Number(p.version), id: String(p.id), slug: String(p.slug), name: String(p.name),
    description: String(p.description), code: String(p.code), category: String(p.category),
    priceCents: p.price_cents === null ? null : Number(p.price_cents),
    approved: !!p.approved, active: !!p.active, featured: !!p.featured,
    images: JSON.parse(String(p.images)), tags: JSON.parse(String(p.tags)),
    variants: variants.filter(v => v.product_id === p.id).map(v => ({
      id: String(v.id), size: String(v.size), stock: Number(v.stock), reserved: Number(v.reserved),
      reported: v.reported === null ? null : Number(v.reported),
    })),
  }));
}
export async function audit(action: string, entity: string) {
  await db().prepare('INSERT INTO audit(action,entity,created_at) VALUES(?,?,?)').run(action, entity, new Date().toISOString());
}
