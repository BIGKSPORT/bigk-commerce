'use client';

import {useEffect,useRef,useState} from 'react';
import type {AdminLiveSnapshot} from '@/lib/admin-live';
import {playOrderChime} from './admin-live-chime';

const euros = new Intl.NumberFormat('en-BE', {style:'currency',currency:'EUR'});
const time = new Intl.DateTimeFormat('en-BE', {timeZone:'Europe/Brussels',timeStyle:'medium'});

export function AdminLive() {
  const [snapshot,setSnapshot] = useState<AdminLiveSnapshot>();
  const [error,setError] = useState(false);
  const [sound,setSound] = useState(false);
  const [audioError,setAudioError] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const enabled = useRef(false);

  useEffect(() => {
    let request: AbortController | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let latest = 0;
    let baseline = false;
    let visibleSince = Date.now();

    async function refresh() {
      if (document.hidden || request) return;
      const current = new AbortController();
      request = current;
      try {
        const response = await fetch('/api/admin/live', {signal:current.signal,cache:'no-store'});
        if (!response.ok) throw new Error('Live view unavailable');
        const result: AdminLiveSnapshot = await response.json();
        if (current.signal.aborted || document.hidden) return;
        const paidAt = result.latestPaidAt ? Date.parse(result.latestPaidAt) : 0;
        if (baseline && paidAt > latest && paidAt > visibleSince &&
            enabled.current && audio.current?.state === 'running') {
          playOrderChime(audio.current);
        }
        baseline = true;
        latest = Math.max(latest, paidAt);
        setSnapshot(result);
        setError(false);
      } catch {
        if (!current.signal.aborted) setError(true);
      } finally {
        if (request === current) {
          request = undefined;
          if (!document.hidden) timer = setTimeout(refresh, 30_000);
        }
      }
    }

    function cancelPoll() {
      clearTimeout(timer);
      request?.abort();
      request = undefined;
    }
    function visibilityChanged() {
      cancelPoll();
      if (!document.hidden) {
        visibleSince = Date.now();
        void refresh();
      }
    }
    document.addEventListener('visibilitychange', visibilityChanged);
    void refresh();
    return () => {
      document.removeEventListener('visibilitychange', visibilityChanged);
      cancelPoll();
      enabled.current = false;
      if (audio.current) void audio.current.close().catch(() => {});
      audio.current = null;
    };
  }, []);

  async function toggleSound() {
    if (enabled.current) {
      enabled.current = false;
      setSound(false);
      return;
    }
    try {
      const context = audio.current ?? new AudioContext();
      audio.current = context;
      await context.resume();
      enabled.current = true;
      setSound(true);
      setAudioError(false);
    } catch {
      setAudioError(true);
    }
  }

  return <section className="bo-panel" aria-labelledby="admin-live-title">
    <header>
      <h2 id="admin-live-title">Live</h2>
      <button type="button" className="button" onClick={() => void toggleSound()} aria-pressed={sound}>
        Order sound {sound ? 'on' : 'off'}
      </button>
    </header>
    {audioError && <p role="status">Order sound is unavailable in this browser.</p>}
    {error && <p role="status">{snapshot ? 'Live data is delayed.' : 'Live data is temporarily unavailable.'}</p>}
    {snapshot ? <>
      <dl className="bo-stats">
        <div><dt>Active carts (estimate)</dt><dd>{snapshot.activeCarts}</dd></div>
        <div><dt>Checkout activity in the last 30 minutes (estimate)</dt><dd>{snapshot.checkoutActivity}</dd></div>
        <div><dt>Purchased today (units)</dt><dd>{snapshot.purchasedUnits}</dd></div>
        <div><dt>Paid orders today</dt><dd>{snapshot.paidOrders}</dd></div>
        <div>
          <dt>Today's sales incl. VAT</dt><dd>{euros.format(snapshot.grossCents / 100)}</dd>
          <dt>Today's sales excl. VAT</dt>
          <dd>{snapshot.netCents === null ? 'Verified VAT breakdown incomplete' : euros.format(snapshot.netCents / 100)}</dd>
        </div>
      </dl>
      <p>Belgium time · Updated {time.format(new Date(snapshot.sampledAt))}</p>
    </> : !error && <p role="status">Loading live activity…</p>}
  </section>;
}
