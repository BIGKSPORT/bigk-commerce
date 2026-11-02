import {productGroups,sharedProducts} from '@/lib/product-groups';
import {publicProducts} from '@/lib/catalog-view';
import {hasAlpinTechnology} from '@/lib/alpin-technology';
import {alpinPaths} from '@/lib/alpin-fleece';
import type { MetadataRoute } from 'next';
import { products } from '@/lib/db';
import { seller } from '@/lib/seller';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const publicIndexing = process.env.INDEXING_ENABLED === 'true' && process.env.COMMERCE_MODE === 'live' && process.env.LIVE_COMMERCE_APPROVED === 'true';
  if (!publicIndexing) return [];
  const catalog = await products();
  const seen = new Set<string>();
  const entries: MetadataRoute.Sitemap = [{ url: seller.origin + '/', changeFrequency: 'weekly', priority: 1 }];
  const alpin=catalog.filter(hasAlpinTechnology);
  if(alpin.length===2&&alpin.every(p=>p.active&&p.approved&&p.images.length)){for(const path of Object.values(alpinPaths))entries.push({url:seller.origin+path,changeFrequency:'weekly',priority:0.8});}
  for (const group of productGroups(publicProducts(sharedProducts(catalog)))) {
    const p=group.parent;
    if(hasAlpinTechnology(p)||!group.colours.some(option=>option.images.length)||seen.has(p.group?.slug||p.slug))continue;
    const slug=p.group?.slug||p.slug;seen.add(slug);
    entries.push({url:seller.origin+'/products/'+encodeURIComponent(slug),changeFrequency:'weekly',priority:0.8});
  }
  return entries;
}
