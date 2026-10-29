import { notFound } from 'next/navigation';
import { products } from '@/lib/db';
import { isLive, liveReady } from '@/lib/commerce';
import Storefront from '@/components/storefront';
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: {
    params: Promise<{
        slug: string;
    }>;
}) { const { slug } = await params, p = (await products()).find(x => x.slug === slug); return { title: p?.name || 'Product not found', description: p?.description }; }
export default async function ProductPage({ params }: {
    params: Promise<{
        slug: string;
    }>;
}) { const { slug } = await params, catalog = (await products()), p = catalog.find(x => x.slug === slug); if (!p)
    notFound(); const json = { '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.description, sku: p.code, brand: { '@type': 'Brand', name: 'BigK' } }; return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json).replace(/</g, '\\u003c') }}/><Storefront products={catalog.map(p => ({ ...p, variants: p.variants.map(v => ({ ...v, stock: Math.max(0, v.stock - v.reserved), reserved: 0, reported: null })) }))} mode={isLive() ? 'live' : 'demo'} ready={liveReady()} initialProduct={p.id}/></>; }
