import {visibleProducts} from '@/lib/catalog-view';
import { products } from '@/lib/db';
import { isLive, liveReady } from '@/lib/commerce';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() { return Response.json({ products: visibleProducts(await products()).map(p => ({ ...p, variants: p.variants.map(v => ({ id: v.id, size: v.size, stock: Math.max(0, v.stock - v.reserved), reserved: 0, reported: null })) })), mode: isLive() ? 'live' : 'demo', ready: liveReady() }, { headers: { 'Cache-Control': 'no-store' } }); }
