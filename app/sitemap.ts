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
  for (const p of catalog) {
    if (!p.active || !p.approved || !p.images.length || !p.slug || seen.has(p.slug)) continue;
    seen.add(p.slug);
    entries.push({ url: seller.origin + '/products/' + encodeURIComponent(p.slug), changeFrequency: 'weekly', priority: 0.8 });
  }
  return entries;
}
