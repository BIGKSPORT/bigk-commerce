'use client';

import {useState} from 'react';

type Order = {
  id: string;
  status: string;
  shippingType: string | null;
  dispatchDeadline: number | null;
  cancellationRequested: boolean;
  items: {id: string; name: string | null; sku: string | null; variant: string | null}[];
};

type Status = 'AWAITING_SHIPMENT' | 'AWAITING_COLLECTION';
const statusLabels: Record<Status,string> = {
  AWAITING_SHIPMENT: 'Awaiting shipment · Klaar voor verzending',
  AWAITING_COLLECTION: 'Awaiting collection · Wacht op ophaling',
};

type OrderPage = {shop: string; nextPage: string; orders: Order[]};
const time = new Intl.DateTimeFormat('nl-BE', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Brussels',
});

export default function TikTokOrders() {
  const [status, setStatus] = useState<Status>('AWAITING_SHIPMENT');
  const [page, setPage] = useState<OrderPage | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load(cursor = '') {
    setBusy(true);
    setError('');
    try {
      const query = new URLSearchParams({status});
      if (cursor) query.set('page', cursor);
      const response = await fetch('/api/integrations/tiktok/orders?' + query, {cache: 'no-store'});
      const data = await response.json();
      if (!response.ok) throw Error(data.error || 'Bestellingen ophalen is mislukt.');
      setPage(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Bestellingen ophalen is mislukt.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="page-container" lang="nl">
    <a href="/admin">Terug naar de backoffice</a>
    <h1>TikTok-bestellingen</h1>
    <label className="field">TikTok-status
      <select value={status} disabled={busy} onChange={event => {
        setStatus(event.currentTarget.value as Status);
        setPage(null);
        setError('');
      }}>
        {Object.entries(statusLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}
      </select>
    </label>
    <button type="button" className="button dark" onClick={() => void load()} disabled={busy}>
      {busy ? 'Bestellingen ophalen…' : 'Haal bestellingen op'}
    </button>
    {error && <p role="alert">{error}</p>}
    {page && <section aria-label={statusLabels[status]}>
      <p role="status">{page.shop} · {page.orders.length} op deze pagina</p>
      {page.orders.length === 0 && <p>TikTok geeft geen bestellingen terug voor deze status.</p>}
      {page.orders.map(order => <details key={order.id}>
        <summary>{order.id} · {order.shippingType === 'SELLER' ? 'Verzonden door verkoper'
          : order.shippingType === 'TIKTOK' ? 'Verzonden via TikTok' : 'Verzendmethode onbekend'}</summary>
        <p>{order.status}{order.dispatchDeadline ? ' · Verzenddeadline: ' + time.format(order.dispatchDeadline * 1000) : ''}</p>
        {order.cancellationRequested && <p>De klant heeft annulering aangevraagd.</p>}
        <ul>{order.items.map(item => <li key={item.id}>
          {[item.name, item.variant, item.sku].filter(Boolean).join(' · ') || item.id}
        </li>)}</ul>
      </details>)}
      {page.nextPage && <button type="button" className="button" disabled={busy} onClick={() => void load(page.nextPage)}>
        Volgende pagina
      </button>}
    </section>}
  </main>;
}
