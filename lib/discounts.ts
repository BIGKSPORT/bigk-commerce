import { z } from 'zod';
import { db } from './db';
import { isPostgres } from './database';
import { HttpError } from './security';

export const discountCodeSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3)
      .max(32)
      .regex(/^[A-Z0-9_-]+$/i, 'Use letters, numbers, - or _ only.'),
    type: z.enum(['percent', 'fixed']),
    value: z.number().int().positive().max(1000000),
    minSubtotalCents: z.number().int().min(0).max(10000000).optional(),
    maxRedemptions: z.number().int().min(1).max(1000000).nullable().optional(),
    perCustomerLimit: z.number().int().min(1).max(100).nullable().optional(),
    startsAt: z.string().nullable().optional(),
    endsAt: z.string().nullable().optional(),
    active: z.boolean().optional(),
    note: z.string().trim().max(200).optional(),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (v.type === 'percent' && v.value > 100) {
      ctx.addIssue({ code: 'custom', message: 'Percent discount cannot exceed 100.', path: ['value'] });
    }
  });

export type DiscountCodeInput = z.infer<typeof discountCodeSchema>;

export type DiscountRow = {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  min_subtotal_cents: number;
  max_redemptions: number | null;
  per_customer_limit: number | null;
  starts_at: string | null;
  ends_at: string | null;
  active: number;
  redemption_count: number;
  note: string;
  created_at: string;
};

let tablesReady = false;

/** PostgreSQL discount tables are provisioned through migrations. */
export async function ensureDiscountTables() {
  if (isPostgres() || tablesReady) return;
  await db()
    .prepare(
      `CREATE TABLE IF NOT EXISTS discount_codes(
        code TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        value INTEGER NOT NULL,
        min_subtotal_cents INTEGER NOT NULL DEFAULT 0,
        max_redemptions INTEGER,
        per_customer_limit INTEGER,
        starts_at TEXT,
        ends_at TEXT,
        active INTEGER NOT NULL DEFAULT 1,
        redemption_count INTEGER NOT NULL DEFAULT 0,
        note TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL
      )`,
    )
    .run();
  await db()
    .prepare(
      `CREATE TABLE IF NOT EXISTS discount_redemptions(
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        order_id TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL,
        discount_cents INTEGER NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`,
    )
    .run();
  tablesReady = true;
}

export function normalizePromoCode(raw: string) {
  return raw.trim().toUpperCase();
}

export function computeDiscountCents(type: 'percent' | 'fixed', value: number, productSubtotalCents: number) {
  if (productSubtotalCents <= 0) return 0;
  const raw = type === 'percent' ? Math.floor((productSubtotalCents * value) / 100) : value;
  return Math.max(0, Math.min(productSubtotalCents, raw));
}

export async function listDiscountCodes(): Promise<DiscountRow[]> {
  await ensureDiscountTables();
  try {
    return (await db().prepare('SELECT * FROM discount_codes ORDER BY created_at DESC').all()) as DiscountRow[];
  } catch {
    return [];
  }
}

export async function upsertDiscountCode(input: DiscountCodeInput) {
  await ensureDiscountTables();
  const parsed = discountCodeSchema.parse(input);
  const code = normalizePromoCode(parsed.code);
  const now = new Date().toISOString();
  const minSubtotal = parsed.minSubtotalCents ?? 0;
  const maxRedemptions = parsed.maxRedemptions ?? null;
  const perCustomer = parsed.perCustomerLimit ?? null;
  const startsAt = parsed.startsAt ?? null;
  const endsAt = parsed.endsAt ?? null;
  const active = parsed.active === false ? 0 : 1;
  const note = parsed.note ?? '';

  const existing = await db().prepare('SELECT code FROM discount_codes WHERE code=?').get(code);
  if (existing) {
    await db()
      .prepare(
        `UPDATE discount_codes SET type=?, value=?, min_subtotal_cents=?, max_redemptions=?, per_customer_limit=?, starts_at=?, ends_at=?, active=?, note=? WHERE code=?`,
      )
      .run(parsed.type, parsed.value, minSubtotal, maxRedemptions, perCustomer, startsAt, endsAt, active, note, code);
  } else {
    await db()
      .prepare(
        `INSERT INTO discount_codes(code,type,value,min_subtotal_cents,max_redemptions,per_customer_limit,starts_at,ends_at,active,redemption_count,note,created_at)
         VALUES(?,?,?,?,?,?,?,?,?,0,?,?)`,
      )
      .run(code, parsed.type, parsed.value, minSubtotal, maxRedemptions, perCustomer, startsAt, endsAt, active, note, now);
  }
  return code;
}

export async function setDiscountActive(code: string, active: boolean) {
  await ensureDiscountTables();
  const n = normalizePromoCode(code);
  const r = await db().prepare('UPDATE discount_codes SET active=? WHERE code=?').run(active ? 1 : 0, n);
  if (!r.changes) throw new HttpError(404, 'Discount code not found.');
}

export async function quotePromoCode(opts: {
  code: string;
  productSubtotalCents: number;
  email: string;
  now?: string;
}) {
  await ensureDiscountTables();
  const code = normalizePromoCode(opts.code);
  const now = opts.now || new Date().toISOString();
  const row = (await db().prepare('SELECT * FROM discount_codes WHERE code=?').get(code)) as DiscountRow | undefined;
  if (!row || !row.active) throw new HttpError(400, 'This promo code is not valid.');
  if (row.starts_at && row.starts_at > now) throw new HttpError(400, 'This promo code is not active yet.');
  if (row.ends_at && row.ends_at < now) throw new HttpError(400, 'This promo code has expired.');
  if (row.max_redemptions != null && row.redemption_count >= row.max_redemptions) {
    throw new HttpError(400, 'This promo code has reached its usage limit.');
  }
  if (opts.productSubtotalCents < row.min_subtotal_cents) {
    throw new HttpError(
      400,
      `This code requires a product subtotal of at least €${(row.min_subtotal_cents / 100).toFixed(2)}.`,
    );
  }
  if (row.per_customer_limit != null && row.per_customer_limit > 0) {
    const used = (await db()
      .prepare(`SELECT COUNT(*) AS n FROM discount_redemptions WHERE code=? AND email=? AND status='applied'`)
      .get(code, opts.email.toLowerCase())) as { n: number } | undefined;
    if (Number(used?.n || 0) >= row.per_customer_limit) {
      throw new HttpError(400, 'You have already used this promo code the maximum number of times.');
    }
  }
  const discountCents = computeDiscountCents(row.type, row.value, opts.productSubtotalCents);
  if (discountCents <= 0) throw new HttpError(400, 'This promo code does not apply to this order.');
  return { code, discountCents, type: row.type, value: row.value };
}

export async function reservePromoForOrder(orderId: string, code: string, email: string, discountCents: number) {
  await ensureDiscountTables();
  const normalized = normalizePromoCode(code);
  const existing = await db().prepare('SELECT id FROM discount_redemptions WHERE order_id=?').get(orderId);
  if (existing) {
    await db()
      .prepare(`UPDATE discount_redemptions SET code=?, discount_cents=?, status='reserved' WHERE order_id=?`)
      .run(normalized, discountCents, orderId);
    return;
  }
  await db()
    .prepare(
      `INSERT INTO discount_redemptions(id,code,order_id,email,discount_cents,status,created_at)
       VALUES(?,?,?,?,?,'reserved',?)`,
    )
    .run(crypto.randomUUID(), normalized, orderId, email.toLowerCase(), discountCents, new Date().toISOString());
}

export async function finalizePromoOnPaid(orderId: string) {
  await ensureDiscountTables();
  const row = (await db().prepare('SELECT * FROM discount_redemptions WHERE order_id=?').get(orderId)) as
    | { code: string; status: string }
    | undefined;
  if (!row || row.status === 'applied') return;
  if (row.status === 'reserved') {
    await db().prepare(`UPDATE discount_redemptions SET status='applied' WHERE order_id=?`).run(orderId);
    await db().prepare(`UPDATE discount_codes SET redemption_count = redemption_count + 1 WHERE code=?`).run(row.code);
  }
}

export async function releasePromoOnCancel(orderId: string) {
  await ensureDiscountTables();
  await db()
    .prepare(`UPDATE discount_redemptions SET status='released' WHERE order_id=? AND status='reserved'`)
    .run(orderId);
}
