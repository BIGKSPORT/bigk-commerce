'use client';

import React, {useMemo, useState} from 'react';
import {ChevronLeft, ChevronRight, Check, Plus, X, ShoppingBag} from 'lucide-react';

type LookVariant = {id: string; size: string};
type LookPiece = {
  id: string;
  name: string;
  brand?: string;
  price: number;
  image: string;
  variants: LookVariant[];
  pin: {top: number; left: number};
};
type RunwayLook = {
  id: string;
  label: string;
  modelImage: string;
  pieces: LookPiece[];
};

/** Live BigK catalogue names, prices and variant IDs (Nov 2026). Model photos are placeholders until real shoot assets are linked. */
const LOOKS: RunwayLook[] = [
  {
    id: 'alpine-thermal',
    label: '01 Alpine',
    modelImage: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=1200&auto=format&fit=crop',
    pieces: [
      {
        id: 'nano',
        name: 'NANO DOWN JACKET',
        brand: 'BIG K',
        price: 186.9,
        image: '/api/media/2fa195a332eaa4df0c0ed122792a42627332e4f32e8e1450ccff2d303156b701.webp',
        pin: {top: 28, left: 48},
        variants: [
          {id: 'P019-0', size: 'S'},
          {id: 'P020-0', size: 'M'},
          {id: 'P020-1', size: 'L'},
          {id: 'P020-2', size: 'XL'},
          {id: 'P020-3', size: 'XXL'},
        ],
      },
      {
        id: 'core2',
        name: 'CORE.2',
        brand: 'BIG K',
        price: 66.9,
        image: '/api/media/ffc2f8d5700278a656c977204b3999577454f2d6bb1c149e499a5e9826421fe9.webp',
        pin: {top: 46, left: 52},
        variants: [
          {id: 'P003-0', size: 'S'},
          {id: 'P003-1', size: 'M'},
          {id: 'P003-2', size: 'L'},
          {id: 'P003-3', size: 'XL'},
          {id: 'P003-4', size: 'XXL'},
        ],
      },
      {
        id: 'scarf',
        name: 'SNAKE SCARF',
        brand: 'BIG K',
        price: 26.9,
        image: '/products/web/snake-scarf-black.webp',
        pin: {top: 14, left: 50},
        variants: [{id: 'P023-0', size: 'One Size'}],
      },
    ],
  },
  {
    id: 'high-loft',
    label: '02 Fleece',
    modelImage: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1200&auto=format&fit=crop',
    pieces: [
      {
        id: 'fleece',
        name: 'ALPINE FLEECE',
        brand: 'BIG K',
        price: 146.9,
        image: '/products/web/alpin-fleece-pro-25303101-1.webp',
        pin: {top: 32, left: 50},
        variants: [
          {id: 'P001-0', size: 'S'},
          {id: 'P001-1', size: 'M'},
          {id: 'P001-2', size: 'L'},
          {id: 'P001-3', size: 'XL'},
          {id: 'P001-4', size: 'XXL'},
        ],
      },
      {
        id: 'gillet',
        name: 'ALPINE GILLET',
        brand: 'BIG K',
        price: 133.9,
        image: '/api/media/540b00ff22e307bfa02920eb7ea85902c90b756e09e4e9f48c6646935b662672.webp',
        pin: {top: 48, left: 46},
        variants: [
          {id: 'P006-0', size: 'S'},
          {id: 'P006-1', size: 'M'},
          {id: 'P006-2', size: 'L'},
          {id: 'P006-3', size: 'XL'},
          {id: 'P006-4', size: 'XXL'},
        ],
      },
      {
        id: 'corelosse',
        name: 'CORELOSSE.2',
        brand: 'BIG K',
        price: 53.9,
        image: '/api/media/26056b6c2840a9e1f191af31ca1f545eec7c76c49d4c28b83afda432347c1026.webp',
        pin: {top: 72, left: 52},
        variants: [
          {id: 'P015-0', size: 'S'},
          {id: 'P015-1', size: 'M'},
          {id: 'P015-2', size: 'L'},
          {id: 'P015-3', size: 'XL'},
        ],
      },
    ],
  },
  {
    id: 'street',
    label: '03 Street',
    modelImage: 'https://images.unsplash.com/photo-1483721074577-83818e388c68?q=80&w=1200&auto=format&fit=crop',
    pieces: [
      {
        id: 'velvet',
        name: 'VELVET WMS HOOD',
        brand: 'BIG K',
        price: 79.9,
        image: '/api/media/eaa341c79badc0159beda22c6a5041ea76fb2e2c7024e336b9312c7ef3e2fdf1.webp',
        pin: {top: 34, left: 48},
        variants: [
          {id: 'P017-0', size: 'S'},
          {id: 'P017-1', size: 'M'},
          {id: 'P017-2', size: 'L'},
          {id: 'P017-3', size: 'XL'},
        ],
      },
      {
        id: 'hood',
        name: 'ALPINE FZ HOOD',
        brand: 'BIG K',
        price: 93.9,
        image: '/api/media/a09a8638c58594f5b096d5bc1166a0271d915eb48c59a789c2dc573ffb996eb6.webp',
        pin: {top: 52, left: 50},
        variants: [
          {id: 'P008-0', size: 'S'},
          {id: 'P008-1', size: 'M'},
          {id: 'P008-2', size: 'L'},
          {id: 'P008-3', size: 'XL'},
        ],
      },
      {
        id: 'scarf2',
        name: 'SNAKE SCARF',
        brand: 'BIG K',
        price: 26.9,
        image: '/products/web/snake-scarf-black.webp',
        pin: {top: 16, left: 50},
        variants: [{id: 'P023-0', size: 'One Size'}],
      },
    ],
  },
];

function money(n: number) {
  return `€${n.toFixed(2)}`;
}

function readBag(): {variantId: string; quantity: number}[] {
  try {
    const raw = JSON.parse(localStorage.getItem('bigk-bag-v2') || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writeBag(next: {variantId: string; quantity: number}[]) {
  localStorage.setItem('bigk-bag-v2', JSON.stringify(next));
  window.dispatchEvent(new Event('bigk-cart-restored'));
  window.dispatchEvent(new Event('bigk-cart-change'));
}

function addVariantsToBag(variantIds: string[]) {
  const bag = readBag();
  for (const variantId of variantIds) {
    const i = bag.findIndex((l) => l.variantId === variantId);
    if (i >= 0) bag[i].quantity = Math.min(5, bag[i].quantity + 1);
    else bag.push({variantId, quantity: 1});
  }
  writeBag(bag);
}

export default function CatwalkLookbook({looks = LOOKS}: {looks?: RunwayLook[]}) {
  const [lookIdx, setLookIdx] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [focusPieceId, setFocusPieceId] = useState<string | null>(null);
  const [sizes, setSizes] = useState<Record<string, string>>({});
  const [included, setIncluded] = useState<Record<string, boolean>>({});
  const [flash, setFlash] = useState<'piece' | 'look' | null>(null);

  const look = looks[lookIdx];

  // Reset inclusion defaults when look changes
  const lookKey = look.id;
  useMemo(() => {
    const nextInc: Record<string, boolean> = {};
    const nextSizes: Record<string, string> = {};
    look.pieces.forEach((p) => {
      nextInc[p.id] = true;
      nextSizes[p.id] = p.variants[0]?.size || '';
    });
    setIncluded(nextInc);
    setSizes((prev) => ({...prev, ...nextSizes}));
    setFocusPieceId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lookKey]);

  const activePieces = look.pieces.filter((p) => included[p.id] !== false);
  const lookTotal = activePieces.reduce((s, p) => s + p.price, 0);

  function variantIdFor(piece: LookPiece) {
    const size = sizes[piece.id] || piece.variants[0]?.size;
    return piece.variants.find((v) => v.size === size)?.id || piece.variants[0]?.id;
  }

  function openPiece(pieceId: string) {
    setFocusPieceId(pieceId);
    setSheetOpen(true);
  }

  function addOne(piece: LookPiece) {
    const vid = variantIdFor(piece);
    if (!vid) return;
    addVariantsToBag([vid]);
    setFlash('piece');
    setTimeout(() => setFlash(null), 1800);
  }

  function addFullLook() {
    const ids = activePieces.map(variantIdFor).filter(Boolean) as string[];
    if (!ids.length) return;
    addVariantsToBag(ids);
    setFlash('look');
    setTimeout(() => setFlash(null), 1800);
  }

  const focused = look.pieces.find((p) => p.id === focusPieceId) || null;

  return (
    <section className="catwalk" aria-label="Shoppable looks">
      <style>{`
        .catwalk{--c-bg:#f7f7f5;--c-ink:#111;--c-muted:#6b6b6b;--c-line:#e6e6e4;--c-bar:#111;max-width:480px;margin:0 auto;padding:24px 16px 48px;font-family:system-ui,-apple-system,sans-serif;color:var(--c-ink);background:var(--c-bg)}
        .catwalk-head{text-align:center;margin-bottom:20px}
        .catwalk-head h2{font-size:1.5rem;font-weight:800;letter-spacing:-0.02em;margin:0 0 6px}
        .catwalk-head p{margin:0;font-size:0.85rem;color:var(--c-muted)}
        .catwalk-stage{position:relative;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.08);border:1px solid var(--c-line)}
        .catwalk-model{position:relative;aspect-ratio:3/4;background:#eee}
        .catwalk-model img{width:100%;height:100%;object-fit:cover;display:block}
        .catwalk-pin{position:absolute;width:28px;height:28px;margin:-14px 0 0 -14px;border-radius:999px;border:2px solid #fff;background:rgba(17,17,17,.88);color:#fff;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,.25);cursor:pointer;z-index:3;transition:transform .15s}
        .catwalk-pin:hover,.catwalk-pin:focus-visible{transform:scale(1.08);outline:none}
        .catwalk-pin.is-active{background:#fff;color:#111}
        .catwalk-hint{position:absolute;left:50%;bottom:72px;transform:translateX(-50%);background:rgba(0,0,0,.55);color:#fff;font-size:10px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;padding:6px 12px;border-radius:999px;pointer-events:none;z-index:2}
        .catwalk-nav{position:absolute;left:12px;right:12px;bottom:12px;display:flex;align-items:center;justify-content:space-between;gap:8px;background:rgba(255,255,255,.92);backdrop-filter:blur(8px);border-radius:999px;padding:6px 8px;z-index:4;border:1px solid var(--c-line)}
        .catwalk-nav button{border:0;background:transparent;padding:6px;border-radius:999px;cursor:pointer;display:flex}
        .catwalk-nav button:hover{background:#f0f0ee}
        .catwalk-nav-label{font-size:12px;font-weight:700;flex:1;text-align:center}
        .catwalk-cta{display:block;width:calc(100% - 24px);margin:12px auto 0;padding:14px 18px;border:0;border-radius:999px;background:var(--c-bar);color:#fff;font-weight:800;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:space-between}
        .catwalk-cta:hover{opacity:.92}
        .catwalk-sheet{position:fixed;inset:0;z-index:50;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.35)}
        .catwalk-sheet-panel{width:100%;max-width:480px;max-height:85vh;overflow:auto;background:#fff;border-radius:20px 20px 0 0;padding:12px 16px 28px;box-shadow:0 -8px 30px rgba(0,0,0,.12)}
        .catwalk-sheet-handle{width:40px;height:4px;background:#ddd;border-radius:999px;margin:4px auto 14px}
        .catwalk-sheet-head{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:12px}
        .catwalk-sheet-head h3{margin:0;font-size:15px;font-weight:800}
        .catwalk-sheet-head span{font-size:12px;color:var(--c-muted)}
        .catwalk-row{display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-top:1px solid var(--c-line)}
        .catwalk-row img{width:64px;height:64px;object-fit:cover;border-radius:10px;background:#f2f2f0;flex-shrink:0}
        .catwalk-row-body{flex:1;min-width:0}
        .catwalk-row-name{font-size:13px;font-weight:700;margin:0 0 2px}
        .catwalk-row-brand{font-size:10px;font-weight:700;letter-spacing:.06em;color:var(--c-muted);text-transform:uppercase}
        .catwalk-row-price{font-size:13px;font-weight:800;margin:4px 0 8px}
        .catwalk-sizes{display:flex;flex-wrap:wrap;gap:6px}
        .catwalk-size{border:1px solid var(--c-line);background:#fff;border-radius:999px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer}
        .catwalk-size.is-on{background:#111;color:#fff;border-color:#111}
        .catwalk-row-actions{display:flex;flex-direction:column;gap:6px;align-items:flex-end}
        .catwalk-icon-btn{width:32px;height:32px;border-radius:999px;border:1px solid var(--c-line);background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer}
        .catwalk-icon-btn.is-off{opacity:.4}
        .catwalk-focus{padding:8px 0 4px}
        .catwalk-focus-title{font-size:12px;color:var(--c-muted);margin-bottom:8px}
        .catwalk-add-one{width:100%;margin-top:8px;padding:12px;border-radius:999px;border:0;background:#111;color:#fff;font-weight:800;font-size:13px;cursor:pointer}
        .catwalk-full{width:100%;margin-top:12px;padding:14px 16px;border-radius:999px;border:0;background:#111;color:#fff;font-weight:800;font-size:13px;cursor:pointer;display:flex;justify-content:space-between;align-items:center}
        .catwalk-full.is-done{background:#0a7a3e}
        .catwalk-toast{font-size:12px;color:var(--c-muted);text-align:center;margin-top:8px}
      `}</style>

      <div className="catwalk-head">
        <h2>Wear the whole look</h2>
        <p>Styled head to toe. Tap a pin, pick sizes, add the outfit in one go.</p>
      </div>

      <div className="catwalk-stage">
        <div className="catwalk-model">
          <img src={look.modelImage} alt={look.label} />
          {look.pieces.map((piece, i) => (
            <button
              key={piece.id}
              type="button"
              className={`catwalk-pin${focusPieceId === piece.id ? ' is-active' : ''}`}
              style={{top: `${piece.pin.top}%`, left: `${piece.pin.left}%`}}
              onClick={() => openPiece(piece.id)}
              aria-label={`Piece ${i + 1}: ${piece.name}`}
            >
              {i + 1}
            </button>
          ))}
          <div className="catwalk-hint">Tap a dot to shop the piece</div>
          <div className="catwalk-nav">
            <button type="button" aria-label="Previous look" onClick={() => setLookIdx((i) => (i > 0 ? i - 1 : looks.length - 1))}>
              <ChevronLeft size={18} />
            </button>
            <div className="catwalk-nav-label">{look.label}</div>
            <button type="button" aria-label="Next look" onClick={() => setLookIdx((i) => (i < looks.length - 1 ? i + 1 : 0))}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <button type="button" className="catwalk-cta" onClick={() => setSheetOpen(true)}>
          <span>Add full look to bag</span>
          <span>{money(lookTotal)} →</span>
        </button>
      </div>

      {sheetOpen && (
        <div className="catwalk-sheet" role="dialog" aria-modal="true" onClick={() => setSheetOpen(false)}>
          <div className="catwalk-sheet-panel" onClick={(e) => e.stopPropagation()}>
            <div className="catwalk-sheet-handle" />
            <div className="catwalk-sheet-head">
              <h3>In this look</h3>
              <span>
                {look.label} · {look.pieces.length} pieces
              </span>
            </div>

            {focused && (
              <div className="catwalk-focus">
                <div className="catwalk-focus-title">Selected piece</div>
                <div className="catwalk-row" style={{borderTop: 'none', paddingTop: 0}}>
                  <img src={focused.image} alt={focused.name} />
                  <div className="catwalk-row-body">
                    <div className="catwalk-row-brand">{focused.brand || 'BIG K'}</div>
                    <p className="catwalk-row-name">{focused.name}</p>
                    <div className="catwalk-row-price">{money(focused.price)}</div>
                    <div className="catwalk-sizes">
                      {focused.variants.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          className={`catwalk-size${(sizes[focused.id] || focused.variants[0].size) === v.size ? ' is-on' : ''}`}
                          onClick={() => setSizes((s) => ({...s, [focused.id]: v.size}))}
                        >
                          {v.size}
                        </button>
                      ))}
                    </div>
                    <button type="button" className="catwalk-add-one" onClick={() => addOne(focused)}>
                      {flash === 'piece' ? 'Added to bag' : `Add to bag · ${money(focused.price)}`}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {look.pieces.map((piece, i) => {
              const on = included[piece.id] !== false;
              return (
                <div key={piece.id} className="catwalk-row">
                  <img src={piece.image} alt={piece.name} />
                  <div className="catwalk-row-body">
                    <div className="catwalk-row-brand">
                      {i + 1} · {piece.brand || 'BIG K'}
                    </div>
                    <p className="catwalk-row-name">{piece.name}</p>
                    <div className="catwalk-row-price">{money(piece.price)}</div>
                    <div className="catwalk-sizes">
                      {piece.variants.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          className={`catwalk-size${(sizes[piece.id] || piece.variants[0].size) === v.size ? ' is-on' : ''}`}
                          onClick={() => setSizes((s) => ({...s, [piece.id]: v.size}))}
                        >
                          {v.size}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="catwalk-row-actions">
                    <button
                      type="button"
                      className={`catwalk-icon-btn${on ? '' : ' is-off'}`}
                      aria-label={on ? 'Remove from look' : 'Include in look'}
                      onClick={() => setIncluded((prev) => ({...prev, [piece.id]: !on}))}
                    >
                      {on ? <Check size={14} /> : <Plus size={14} />}
                    </button>
                    <button type="button" className="catwalk-icon-btn" aria-label="Close" onClick={() => setFocusPieceId(piece.id)}>
                      <X size={14} />
                    </button>
                  </div>
                </div>
              );
            })}

            <button type="button" className={`catwalk-full${flash === 'look' ? ' is-done' : ''}`} onClick={addFullLook}>
              <span className="flex items-center gap-2" style={{display: 'flex', alignItems: 'center', gap: 8}}>
                {flash === 'look' ? <Check size={16} /> : <ShoppingBag size={16} />}
                {flash === 'look' ? 'Full look added' : 'Add full look to bag'}
              </span>
              <span>{money(lookTotal)} →</span>
            </button>
            {flash && <p className="catwalk-toast">{activePieces.length} piece{activePieces.length === 1 ? '' : 's'} in your bag.</p>}
          </div>
        </div>
      )}
    </section>
  );
}
