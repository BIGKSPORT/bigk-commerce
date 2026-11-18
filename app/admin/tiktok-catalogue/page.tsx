'use client';
import { useState } from 'react';

type ReviewPage = {
  shop: string;
  total: number | null;
  nextPage: string;
  listings: {
    id: string; title?: string; status?: string; imageCount?: number; hasVideo?: boolean; detailError?: string;
    variants?: { id: string; sku?: string; ean: string; options?: string; match: { name: string; colour: string; size: string } | null }[];
  }[];
};

export default function TikTokCatalogueReview() {
  const [page, setPage] = useState<ReviewPage | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load(cursor = '') {
    setBusy(true);
    setError('');
    try {
      const query = cursor ? '?' + new URLSearchParams({ page: cursor }).toString() : '';
      const response = await fetch('/api/integrations/tiktok/catalogue' + query, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'TikTok catalogue unavailable.');
      setPage(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'TikTok catalogue unavailable.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="page-container">
    <a href="/admin">Back to BIG K back office</a>
    <h1>TikTok Shop catalogue review</h1>
    <p>Compare TikTok listings and variants with verified BIG K EANs.</p>
    <button type="button" className="button dark" onClick={() => void load()} disabled={busy}>{busy ? 'Reading TikTok…' : 'Pull TikTok listings'}</button>
    {error && <p role="alert">{error}</p>}
    {page && <section aria-label="TikTok listings">
      <p role="status">{page.shop} · {page.total === null ? page.listings.length + ' listings on this page' : page.total + ' listings'}</p>
      {page.listings.length === 0 && <p>TikTok returned no listings on this page.</p>}
      {page.listings.map(listing => <details key={listing.id}>
        <summary>{listing.title || listing.id} · {listing.status || 'Status unavailable'}</summary>
        {listing.detailError ? <p>{listing.detailError}</p> : <>
          <p>{listing.imageCount ?? 0} listing photos · {listing.hasVideo ? 'Video available' : 'No listing video'}</p>
          <ul>{listing.variants?.map(variant => <li key={variant.id}>{variant.options || variant.sku || variant.id} · {variant.ean || 'EAN missing'} · {variant.match ? [variant.match.name, variant.match.colour, variant.match.size].filter(Boolean).join(' / ') : 'Needs review'}</li>)}</ul>
        </>}
      </details>)}
      {page.nextPage && <button type="button" className="button" disabled={busy} onClick={() => void load(page.nextPage)}>Next page</button>}
    </section>}
  </main>;
}
