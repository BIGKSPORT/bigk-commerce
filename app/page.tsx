import {localizedPublicCatalog} from '@/lib/localized-public-catalog';
import {storefrontMerchandising} from '@/lib/merchandising';
import {publicCategoryOptions} from '@/lib/catalog-categories';
import {storefrontContext} from '@/lib/storefront-context';
import {resolveProduct,publicProducts,visibleProducts} from '@/lib/catalog-view';
import { isLive, liveReady } from '@/lib/commerce';
import {colourOptions} from '@/lib/product-groups';
import B10HomeBanner from '@/components/b10-home-banner';
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
 const {path,locale}=await getSiteLanguage();
 const publicCatalog=publicProducts(raw);
 const b10=resolveProduct(publicCatalog,'b10-sneakers');
 const options=b10?colourOptions(publicCatalog,b10).filter(option=>option.images.length):[];
 const launchBanner=process.env.B10_HOMEPAGE_BANNER!=='off'&&!preview&&!category&&!series&&saved!=='1'&&options.length ? <B10HomeBanner catalog={publicCatalog} options={options} locale={locale} path={path}/> : undefined;
 return <>{preview&&<div className="info-message" role="status">PRIVATE STORE PREVIEW · Draft products visible · Purchasing disabled · <a href="/admin">Back to backoffice</a></div>}<Storefront launchBanner={launchBanner} merchandising={await storefrontMerchandising(raw)} categoryOptions={await publicCategoryOptions()} products={(preview?visibleProducts(raw):await localizedPublicCatalog(raw)).map(p => ({ ...p, variants: p.variants.filter(v=>!p.content?.trade?.identifiers?.[v.id]?.archived).map(v => ({ ...v, stock: Math.max(0, v.stock - v.reserved), reserved: 0, reported: null })) }))} mode={preview?'live':isLive() ? 'live' : 'demo'} ready={preview?false:liveReady()} initialCategory={category} initialSavedOnly={saved==='1'} initialSeries={series}/></>; }

