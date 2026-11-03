import type { MetadataRoute } from 'next';
import { seller } from '@/lib/seller';

export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  const publicIndexing = process.env.INDEXING_ENABLED === 'true' && process.env.COMMERCE_MODE === 'live' && process.env.LIVE_COMMERCE_APPROVED === 'true';
  return {
    rules: publicIndexing
      ? [{ userAgent: '*', allow: '/', disallow: ['/admin', '/account', '/checkout', '/order', '/api/',...['en','nl','fr'].flatMap(locale=>['account','checkout','order'].map(page=>'/'+locale+'/'+page))] }]
      : [{ userAgent: '*', disallow: '/' }],
    ...(publicIndexing ? { sitemap: seller.origin + '/sitemap.xml' } : {}),
  };
}
