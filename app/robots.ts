import {seoEnabled} from '@/lib/product-seo';
import {publicIndexingEnabled} from '@/lib/search-visibility';
import type { MetadataRoute } from 'next';
import { seller } from '@/lib/seller';

export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  const publicIndexing = publicIndexingEnabled();
  return {
    rules: publicIndexing
      ? [{ userAgent: '*', allow: seoEnabled()?['/','/api/media/','/api/product-feeds/']:'/', disallow: ['/admin', '/staff', '/warehouse', '/account', '/checkout', '/order', '/api/',...['en','nl','fr'].flatMap(locale=>['account','checkout','order'].map(page=>'/'+locale+'/'+page))] }]
      : [{ userAgent: '*', disallow: '/' }],
    ...(publicIndexing ? { sitemap: seller.origin + '/sitemap.xml' } : {}),
  };
}

