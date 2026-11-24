import type { Metadata } from 'next';

const shareImage = '/bigk-share-preview.png';
export const metadata: Metadata = {
  openGraph: {
    type: 'website',
    siteName: 'BIG K',
    images: [{ url: shareImage, width: 1200, height: 630, alt: 'BIG K logo and B10 campaign with a red shoebox' }],
  },
  twitter: { card: 'summary_large_image', images: [shareImage] },
};

import {localizedPublicCatalog} from '@/lib/localized-public-catalog';
import {storefrontMerchandising} from '@/lib/merchandising';
import {publicCategoryOptions} from '@/lib/catalog-categories';
import {storefrontContext} from '@/lib/storefront-context';
import {visibleProducts} from '@/lib/catalog-view';
import { isLive, liveReady } from '@/lib/commerce';
import Storefront from '@/components/storefront';
export const dynamic = 'force-dynamic';
export default async function Home({ searchParams }: {
    searchParams: Promise<{
        category?: string;
        series?: string;
        saved?: string;
    }>;
}) { const { category,saved,series } = await searchParams; const {preview,catalog:raw}=await storefrontContext();
 return <>{preview&&<div className="info-message" role="status">PRIVATE STORE PREVIEW · Draft products visible · Purchasing disabled · <a href="/admin">Back to backoffice</a></div>}<Storefront merchandising={await storefrontMerchandising(raw)} categoryOptions={await publicCategoryOptions()} products={(preview?visibleProducts(raw):await localizedPublicCatalog(raw)).map(p => ({ ...p, variants: p.variants.filter(v=>!p.content?.trade?.identifiers?.[v.id]?.archived).map(v => ({ ...v, stock: Math.max(0, v.stock - v.reserved), reserved: 0, reported: null })) }))} mode={preview?'live':isLive() ? 'live' : 'demo'} ready={preview?false:liveReady()} initialCategory={category} initialSavedOnly={saved==='1'} initialSeries={series}/></>; }

