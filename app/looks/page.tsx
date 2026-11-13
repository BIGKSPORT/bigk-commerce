import CatwalkLookbook, {buildsFromMerchandising} from '@/components/catwalk-lookbook';
import {storefrontMerchandising} from '@/lib/merchandising';
import {storefrontContext} from '@/lib/storefront-context';
import {localizedPublicCatalog} from '@/lib/localized-public-catalog';
import {visibleProducts} from '@/lib/catalog-view';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Looks · BIG K',
  description: 'Wear the whole look. Shoppable runway outfits from BIG K.',
};

export default async function LooksPage() {
  const {preview, catalog: raw} = await storefrontContext();
  const products = (preview ? visibleProducts(raw) : await localizedPublicCatalog(raw)).map((p) => ({
    ...p,
    variants: p.variants
      .filter((v) => !p.content?.trade?.identifiers?.[v.id]?.archived)
      .map((v) => ({...v, stock: Math.max(0, v.stock - v.reserved), reserved: 0, reported: null})),
  }));
  const merch = await storefrontMerchandising(raw);
  const looks = buildsFromMerchandising(merch, products);

  return (
    <main id="main">
      <CatwalkLookbook looks={looks} />
    </main>
  );
}
