import {publicProducts} from '@/lib/catalog-view';
import { products } from '@/lib/db';
import { isLive, liveReady } from '@/lib/commerce';
import Storefront from '@/components/storefront';
export const dynamic = 'force-dynamic';
export default async function Home({ searchParams }: {
    searchParams: Promise<{
        category?: string;
        saved?: string;
    }>;
}) { const { category,saved } = await searchParams; return <Storefront products={publicProducts(await products()).map(p => ({ ...p, variants: p.variants.map(v => ({ ...v, stock: Math.max(0, v.stock - v.reserved), reserved: 0, reported: null })) }))} mode={isLive() ? 'live' : 'demo'} ready={liveReady()} initialCategory={category} initialSavedOnly={saved==='1'}/>; }
