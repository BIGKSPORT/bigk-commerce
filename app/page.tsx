import {localizedPublicCatalog} from '@/lib/localized-public-catalog';
import {storefrontMerchandising} from '@/lib/merchandising';
import {publicCategoryOptions} from '@/lib/catalog-categories';
import {storefrontContext} from '@/lib/storefront-context';
import {resolveProduct,visibleProducts} from '@/lib/catalog-view';
import { isLive, liveReady } from '@/lib/commerce';
import Link from 'next/link';
import {getSiteLanguage} from '@/lib/i18n/site-server';
import Storefront from '@/components/storefront';
export const dynamic = 'force-dynamic';
export default async function Home({ searchParams }: {
    searchParams: Promise<{
        category?: string;
        series?: string;
        saved?: string;
    }>;
}) { const { category,saved,series } = await searchParams; const {preview,catalog:raw}=await storefrontContext();
 const {path}=await getSiteLanguage();
 const b10=resolveProduct(raw,'b10-sneakers');
 const launchBanner=!preview&&!category&&!series&&saved!=='1'&&b10?.active&&b10.approved ? (
  <Link href={path('/products/b10-sneakers')} prefetch={false} aria-label="Shop the BIG K B10 sneaker" style={{display:'block',background:'#191020',marginBottom:'clamp(24px, 4vw, 56px)'}}>
   <img src="/b10-launch.webp" alt="BIG K Grand Show Release B10" width={880} height={1100} style={{display:'block',width:'min(100%, 520px)',height:'auto',margin:'0 auto'}}/>
  </Link>
 ) : undefined;
 return <>{preview&&<div className="info-message" role="status">PRIVATE STORE PREVIEW · Draft products visible · Purchasing disabled · <a href="/admin">Back to backoffice</a></div>}<Storefront launchBanner={launchBanner} merchandising={await storefrontMerchandising(raw)} categoryOptions={await publicCategoryOptions()} products={(preview?visibleProducts(raw):await localizedPublicCatalog(raw)).map(p => ({ ...p, variants: p.variants.filter(v=>!p.content?.trade?.identifiers?.[v.id]?.archived).map(v => ({ ...v, stock: Math.max(0, v.stock - v.reserved), reserved: 0, reported: null })) }))} mode={preview?'live':isLive() ? 'live' : 'demo'} ready={preview?false:liveReady()} initialCategory={category} initialSavedOnly={saved==='1'} initialSeries={series}/></>; }

