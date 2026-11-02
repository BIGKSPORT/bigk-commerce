import {storefrontContext} from '@/lib/storefront-context';
import {publicProducts,visibleProducts} from '@/lib/catalog-view';
import { isLive, liveReady } from '@/lib/commerce';
import Storefront from '@/components/storefront';
export const dynamic = 'force-dynamic';
export default async function Home({ searchParams }: {
    searchParams: Promise<{
        category?: string;
        saved?: string;
    }>;
}) { const { category,saved } = await searchParams; const {preview,catalog:raw}=await storefrontContext();return <>{preview&&<div className="info-message" role="status">PRIVATE STORE PREVIEW · Draft products visible · Purchasing disabled · <a href="/admin">Back to backoffice</a></div>}<Storefront products={(preview?visibleProducts(raw):publicProducts(raw)).map(p => ({ ...p, variants: p.variants.filter(v=>!p.content?.trade?.identifiers?.[v.id]?.archived).map(v => ({ ...v, stock: Math.max(0, v.stock - v.reserved), reserved: 0, reported: null })) }))} mode={preview?'live':isLive() ? 'live' : 'demo'} ready={preview?false:liveReady()} initialCategory={category} initialSavedOnly={saved==='1'}/></>; }
