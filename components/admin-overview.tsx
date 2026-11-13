'use client';

import {useMemo, useState} from 'react';
import type {Order} from '@/lib/types';
import {money} from '@/lib/format';

type Range = '7d' | '30d' | '90d' | '365d' | 'all';

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function rangeStart(range: Range): Date | null {
  if (range === 'all') return null;
  const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
  const d = startOfDay(new Date());
  d.setDate(d.getDate() - (days - 1));
  return d;
}

function isCounted(status: string) {
  return status === 'paid' || status === 'fulfilled';
}

function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDayLabel(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'});
}

export function AdminOverview({
  orders,
  liveProducts,
  totalProducts,
  availableUnits,
  onOpenOrders,
}: {
  orders: Order[];
  liveProducts: number;
  totalProducts: number;
  availableUnits: number;
  onOpenOrders: () => void;
}) {
  const [range, setRange] = useState<Range>('30d');

  const stats = useMemo(() => {
    const from = rangeStart(range);
    const counted = orders.filter((o) => isCounted(o.status) && (!from || new Date(o.createdAt) >= from));
    const pendingShip = orders.filter((o) => o.status === 'paid');
    const review = orders.filter((o) => o.status === 'payment_review');

    const gross = counted.reduce((n, o) => n + o.subtotal, 0);
    const shipping = counted.reduce((n, o) => n + o.shipping, 0);
    const total = counted.reduce((n, o) => n + o.total, 0);
    const aov = counted.length ? Math.round(total / counted.length) : 0;

    // daily series
    const byDay = new Map<string, number>();
    if (from) {
      const cursor = new Date(from);
      const end = startOfDay(new Date());
      while (cursor <= end) {
        byDay.set(dayKey(cursor.toISOString()), 0);
        cursor.setDate(cursor.getDate() + 1);
      }
    }
    for (const o of counted) {
      const k = dayKey(o.createdAt);
      byDay.set(k, (byDay.get(k) || 0) + o.total);
    }
    const series = [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0]));

    // top products
    const productMap = new Map<string, {name: string; cents: number; qty: number}>();
    for (const o of counted) {
      for (const line of o.items || []) {
        const key = line.name;
        const prev = productMap.get(key) || {name: line.name, cents: 0, qty: 0};
        prev.cents += line.unitPrice * line.quantity;
        prev.qty += line.quantity;
        productMap.set(key, prev);
      }
    }
    const topProducts = [...productMap.values()].sort((a, b) => b.cents - a.cents).slice(0, 6);
    const topMax = topProducts[0]?.cents || 1;

    return {
      orderCount: counted.length,
      fulfilled: counted.filter((o) => o.status === 'fulfilled').length,
      pendingShip: pendingShip.length,
      review: review.length,
      gross,
      shipping,
      total,
      aov,
      series,
      topProducts,
      topMax,
    };
  }, [orders, range]);

  const maxY = Math.max(1, ...stats.series.map(([, v]) => v));
  const chartW = 640;
  const chartH = 200;
  const pad = 8;
  const points = stats.series.map(([, v], i) => {
    const x = stats.series.length <= 1 ? chartW / 2 : (i / (stats.series.length - 1)) * (chartW - pad * 2) + pad;
    const y = chartH - pad - (v / maxY) * (chartH - pad * 2);
    return `${x},${y}`;
  });
  const polyline = points.join(' ');
  const area =
    stats.series.length > 1
      ? `M ${points[0]} L ${points.slice(1).join(' L ')} L ${chartW - pad},${chartH - pad} L ${pad},${chartH - pad} Z`
      : '';

  return (
    <div className="bk-overview">
      <style>{css}</style>

      <div className="bk-overview-toolbar">
        <div className="bk-range" role="group" aria-label="Date range">
          {(
            [
              ['7d', 'Last 7 days'],
              ['30d', 'Last 30 days'],
              ['90d', 'Last 90 days'],
              ['365d', 'Last 365 days'],
              ['all', 'All time'],
            ] as const
          ).map(([id, label]) => (
            <button key={id} type="button" className={range === id ? 'is-on' : ''} onClick={() => setRange(id)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="bk-kpi-row">
        <article className="bk-kpi">
          <span className="bk-kpi-label">Gross sales</span>
          <strong className="bk-kpi-value">{money(stats.gross)}</strong>
          <small>{stats.orderCount} paid / fulfilled orders</small>
        </article>
        <article className="bk-kpi">
          <span className="bk-kpi-label">Orders</span>
          <strong className="bk-kpi-value">{stats.orderCount}</strong>
          <small>{stats.fulfilled} fulfilled</small>
        </article>
        <article className="bk-kpi">
          <span className="bk-kpi-label">Average order value</span>
          <strong className="bk-kpi-value">{money(stats.aov)}</strong>
          <small>Including shipping</small>
        </article>
        <article className="bk-kpi bk-kpi-action" role="button" tabIndex={0} onClick={onOpenOrders} onKeyDown={(e) => e.key === 'Enter' && onOpenOrders()}>
          <span className="bk-kpi-label">Ready to fulfill</span>
          <strong className="bk-kpi-value">{stats.pendingShip}</strong>
          <small>Open orders →</small>
        </article>
      </div>

      <div className="bk-main-grid">
        <section className="bk-card bk-chart-card">
          <div className="bk-card-head">
            <div>
              <h2>Total sales over time</h2>
              <p className="bk-card-metric">{money(stats.total)}</p>
            </div>
          </div>
          {stats.series.length === 0 || stats.orderCount === 0 ? (
            <p className="bk-empty">No paid orders in this period yet. Sales will appear here after the first successful checkout.</p>
          ) : (
            <div className="bk-chart-wrap">
              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="bk-chart" role="img" aria-label="Sales over time">
                {area && <path d={area} className="bk-chart-area" />}
                <polyline points={polyline} className="bk-chart-line" fill="none" />
              </svg>
              <div className="bk-chart-axis">
                <span>{stats.series[0] ? formatDayLabel(stats.series[0][0]) : ''}</span>
                <span>{stats.series.length > 1 ? formatDayLabel(stats.series[Math.floor(stats.series.length / 2)][0]) : ''}</span>
                <span>{stats.series.length ? formatDayLabel(stats.series[stats.series.length - 1][0]) : ''}</span>
              </div>
            </div>
          )}
        </section>

        <section className="bk-card">
          <div className="bk-card-head">
            <h2>Total sales breakdown</h2>
          </div>
          <dl className="bk-breakdown">
            <div>
              <dt>Gross sales</dt>
              <dd>{money(stats.gross)}</dd>
            </div>
            <div>
              <dt>Shipping charges</dt>
              <dd>{money(stats.shipping)}</dd>
            </div>
            <div>
              <dt>Discounts</dt>
              <dd>{money(0)}</dd>
            </div>
            <div>
              <dt>Returns</dt>
              <dd>{money(0)}</dd>
            </div>
            <div className="bk-breakdown-total">
              <dt>Total sales</dt>
              <dd>{money(stats.total)}</dd>
            </div>
          </dl>
          <p className="bk-hint">Discounts and returns show here once those flows are recorded in the store.</p>
        </section>
      </div>

      <div className="bk-main-grid bk-main-grid-3">
        <section className="bk-card">
          <div className="bk-card-head">
            <h2>Sales by product</h2>
          </div>
          {stats.topProducts.length === 0 ? (
            <p className="bk-empty">No product sales in this period.</p>
          ) : (
            <ul className="bk-bars">
              {stats.topProducts.map((p) => (
                <li key={p.name}>
                  <div className="bk-bar-meta">
                    <span className="bk-bar-name">{p.name}</span>
                    <span className="bk-bar-val">{money(p.cents)}</span>
                  </div>
                  <div className="bk-bar-track">
                    <div className="bk-bar-fill" style={{width: `${Math.max(4, (p.cents / stats.topMax) * 100)}%`}} />
                  </div>
                  <small>{p.qty} units</small>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bk-card">
          <div className="bk-card-head">
            <h2>Store health</h2>
          </div>
          <dl className="bk-breakdown">
            <div>
              <dt>Published products</dt>
              <dd>
                {liveProducts} / {totalProducts}
              </dd>
            </div>
            <div>
              <dt>Available units</dt>
              <dd>{availableUnits.toLocaleString('en-GB')}</dd>
            </div>
            <div>
              <dt>Payment review</dt>
              <dd>{stats.review}</dd>
            </div>
            <div>
              <dt>Awaiting shipment</dt>
              <dd>{stats.pendingShip}</dd>
            </div>
          </dl>
          {stats.review > 0 && (
            <p className="bk-warn">Orders in payment review need a manual check before fulfillment.</p>
          )}
        </section>

        <section className="bk-card">
          <div className="bk-card-head">
            <h2>Average order value</h2>
          </div>
          <p className="bk-card-metric">{money(stats.aov)}</p>
          <p className="bk-hint">Based on paid and fulfilled orders in the selected period (including shipping).</p>
        </section>
      </div>
    </div>
  );
}

const css = `
.bk-overview{display:flex;flex-direction:column;gap:16px}
.bk-overview-toolbar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between}
.bk-range{display:flex;flex-wrap:wrap;gap:6px;background:#fff;border:1px solid #e8e8e6;border-radius:10px;padding:4px}
.bk-range button{border:0;background:transparent;padding:7px 12px;border-radius:8px;font-size:12px;font-weight:600;color:#5c5c5c;cursor:pointer}
.bk-range button.is-on{background:#111;color:#fff}
.bk-kpi-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
@media (max-width:960px){.bk-kpi-row{grid-template-columns:repeat(2,minmax(0,1fr))}}
.bk-kpi{background:#fff;border:1px solid #e8e8e6;border-radius:14px;padding:16px 18px;display:flex;flex-direction:column;gap:6px}
.bk-kpi-label{font-size:12px;font-weight:600;color:#6b6b6b}
.bk-kpi-value{font-size:1.45rem;font-weight:800;letter-spacing:-0.02em;color:#111}
.bk-kpi small{font-size:11px;color:#8a8a8a}
.bk-kpi-action{cursor:pointer;transition:border-color .15s,box-shadow .15s}
.bk-kpi-action:hover{border-color:#111;box-shadow:0 4px 14px rgba(0,0,0,.06)}
.bk-main-grid{display:grid;grid-template-columns:1.6fr 1fr;gap:12px}
.bk-main-grid-3{grid-template-columns:1.2fr 1fr 1fr}
@media (max-width:960px){.bk-main-grid,.bk-main-grid-3{grid-template-columns:1fr}}
.bk-card{background:#fff;border:1px solid #e8e8e6;border-radius:14px;padding:18px}
.bk-card-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px}
.bk-card-head h2{margin:0;font-size:14px;font-weight:700;color:#111}
.bk-card-metric{margin:4px 0 0;font-size:1.5rem;font-weight:800;letter-spacing:-0.02em}
.bk-chart-wrap{margin-top:8px}
.bk-chart{width:100%;height:auto;display:block}
.bk-chart-line{stroke:#2a6af2;stroke-width:2.5;stroke-linejoin:round;stroke-linecap:round}
.bk-chart-area{fill:rgba(42,106,242,.12)}
.bk-chart-axis{display:flex;justify-content:space-between;font-size:11px;color:#8a8a8a;margin-top:6px}
.bk-breakdown{margin:0;display:flex;flex-direction:column;gap:10px}
.bk-breakdown div{display:flex;justify-content:space-between;gap:12px;font-size:13px}
.bk-breakdown dt{color:#5c5c5c;margin:0}
.bk-breakdown dd{margin:0;font-weight:700;color:#111}
.bk-breakdown-total{padding-top:10px;border-top:1px solid #eee;font-size:14px}
.bk-breakdown-total dd{font-weight:800}
.bk-bars{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:12px}
.bk-bar-meta{display:flex;justify-content:space-between;gap:8px;font-size:12px;font-weight:600}
.bk-bar-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:70%}
.bk-bar-track{height:8px;background:#f0f0ee;border-radius:999px;overflow:hidden;margin:4px 0 2px}
.bk-bar-fill{height:100%;background:#2a6af2;border-radius:999px}
.bk-bars small{font-size:11px;color:#8a8a8a}
.bk-empty{margin:0;font-size:13px;color:#6b6b6b;line-height:1.4}
.bk-hint{margin:12px 0 0;font-size:11px;color:#8a8a8a;line-height:1.4}
.bk-warn{margin:12px 0 0;font-size:12px;color:#9a3412;background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:8px 10px}
`;
