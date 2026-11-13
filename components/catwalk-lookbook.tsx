'use client';

import React, {useState} from 'react';
import {ShoppingBag, Check, ChevronLeft, ChevronRight, X} from 'lucide-react';

export interface LookVariant {
  id: string; // real catalogue variantId (e.g. P001-0)
  size: string;
}

export interface LookPiece {
  id: string;
  modelCode: string;
  name: string;
  category: string;
  price: number;
  image: string;
  variants: LookVariant[];
  pinPosition: {top: number; left: number};
}

export interface RunwayLook {
  id: number;
  title: string;
  subtitle: string;
  modelImage: string;
  pieces: LookPiece[];
}

/**
 * Names, prices and variant IDs matched to live bigk.be catalogue (Nov 2026).
 * Images use real product media paths. Model runway photos are still placeholders.
 * Core Pants / Neofit are not public yet — substituted with active products.
 */
const BIGK_LOOKS: RunwayLook[] = [
  {
    id: 1,
    title: 'Look 01 · Alpine Thermal',
    subtitle: 'Nano Down, Core.2 & Snake Scarf',
    modelImage: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=1200&auto=format&fit=crop',
    pieces: [
      {
        id: 'P019',
        modelCode: '25302901',
        name: 'NANO DOWN JACKET',
        category: 'OUTERWEAR',
        price: 186.9,
        image: '/api/media/2fa195a332eaa4df0c0ed122792a42627332e4f32e8e1450ccff2d303156b701.webp',
        pinPosition: {top: 30, left: 48},
        variants: [
          {id: 'P019-0', size: 'S'},
          {id: 'P020-0', size: 'M'},
          {id: 'P020-1', size: 'L'},
          {id: 'P020-2', size: 'XL'},
          {id: 'P020-3', size: 'XXL'},
          {id: 'P020-4', size: 'XXXL'},
        ],
      },
      {
        id: 'P003',
        modelCode: '25301801',
        name: 'CORE.2',
        category: 'BASELAYER',
        price: 66.9,
        image: '/api/media/ffc2f8d5700278a656c977204b3999577454f2d6bb1c149e499a5e9826421fe9.webp',
        pinPosition: {top: 48, left: 52},
        variants: [
          {id: 'P003-0', size: 'S'},
          {id: 'P003-1', size: 'M'},
          {id: 'P003-2', size: 'L'},
          {id: 'P003-3', size: 'XL'},
          {id: 'P003-4', size: 'XXL'},
          {id: 'P003-5', size: 'XXXL'},
        ],
      },
      {
        id: 'P008',
        modelCode: '25301601',
        name: 'ALPINE FZ HOOD',
        category: 'MIDLAYER',
        price: 93.9,
        image: '/api/media/a09a8638c58594f5b096d5bc1166a0271d915eb48c59a789c2dc573ffb996eb6.webp',
        pinPosition: {top: 72, left: 50},
        variants: [
          {id: 'P008-0', size: 'S'},
          {id: 'P008-1', size: 'M'},
          {id: 'P008-2', size: 'L'},
          {id: 'P008-3', size: 'XL'},
          {id: 'P008-4', size: 'XXL'},
          {id: 'P008-5', size: 'XXXL'},
        ],
      },
      {
        id: 'P023',
        modelCode: '25302401',
        name: 'SNAKE SCARF',
        category: 'ACCESSORIES',
        price: 26.9,
        image: '/products/web/snake-scarf-black.webp',
        pinPosition: {top: 16, left: 50},
        variants: [{id: 'P023-0', size: 'One Size'}],
      },
    ],
  },
  {
    id: 2,
    title: 'Look 02 · High-Loft Alpine',
    subtitle: 'Alpine Fleece, Gillet & Corelosse.2',
    modelImage: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1200&auto=format&fit=crop',
    pieces: [
      {
        id: 'P001',
        modelCode: '25303101',
        name: 'ALPINE FLEECE',
        category: 'MIDLAYER',
        price: 146.9,
        image: '/products/web/alpin-fleece-pro-25303101-1.webp',
        pinPosition: {top: 35, left: 50},
        variants: [
          {id: 'P001-0', size: 'S'},
          {id: 'P001-1', size: 'M'},
          {id: 'P001-2', size: 'L'},
          {id: 'P001-3', size: 'XL'},
          {id: 'P001-4', size: 'XXL'},
          {id: 'P001-5', size: 'XXXL'},
        ],
      },
      {
        id: 'P006',
        modelCode: '25303201',
        name: 'ALPINE GILLET',
        category: 'VESTS',
        price: 133.9,
        image: '/api/media/540b00ff22e307bfa02920eb7ea85902c90b756e09e4e9f48c6646935b662672.webp',
        pinPosition: {top: 46, left: 48},
        variants: [
          {id: 'P006-0', size: 'S'},
          {id: 'P006-1', size: 'M'},
          {id: 'P006-2', size: 'L'},
          {id: 'P006-3', size: 'XL'},
          {id: 'P006-4', size: 'XXL'},
          {id: 'P006-5', size: 'XXXL'},
        ],
      },
      {
        id: 'P015',
        modelCode: '25301902',
        name: 'CORELOSSE.2',
        category: 'TOPS',
        price: 53.9,
        image: '/api/media/26056b6c2840a9e1f191af31ca1f545eec7c76c49d4c28b83afda432347c1026.webp',
        pinPosition: {top: 76, left: 52},
        variants: [
          {id: 'P015-0', size: 'S'},
          {id: 'P015-1', size: 'M'},
          {id: 'P015-2', size: 'L'},
          {id: 'P015-3', size: 'XL'},
          {id: 'P015-4', size: 'XXL'},
          {id: 'P015-5', size: 'XXXL'},
        ],
      },
    ],
  },
  {
    id: 3,
    title: 'Look 03 · Street Athleisure',
    subtitle: 'Velvet WMS Hood & Corelosse.2',
    modelImage: 'https://images.unsplash.com/photo-1483721074577-83818e388c68?q=80&w=1200&auto=format&fit=crop',
    pieces: [
      {
        id: 'P017',
        modelCode: '25000701',
        name: 'VELVET WMS HOOD',
        category: 'HOODIES',
        price: 79.9,
        image: '/api/media/eaa341c79badc0159beda22c6a5041ea76fb2e2c7024e336b9312c7ef3e2fdf1.webp',
        pinPosition: {top: 35, left: 48},
        variants: [
          {id: 'P017-0', size: 'S'},
          {id: 'P017-1', size: 'M'},
          {id: 'P017-2', size: 'L'},
          {id: 'P017-3', size: 'XL'},
          {id: 'P017-4', size: 'XXL'},
        ],
      },
      {
        id: 'P015-look3',
        modelCode: '25301902',
        name: 'CORELOSSE.2',
        category: 'TOPS',
        price: 53.9,
        image: '/api/media/26056b6c2840a9e1f191af31ca1f545eec7c76c49d4c28b83afda432347c1026.webp',
        pinPosition: {top: 54, left: 50},
        variants: [
          {id: 'P015-0', size: 'S'},
          {id: 'P015-1', size: 'M'},
          {id: 'P015-2', size: 'L'},
          {id: 'P015-3', size: 'XL'},
          {id: 'P015-4', size: 'XXL'},
          {id: 'P015-5', size: 'XXXL'},
        ],
      },
      {
        id: 'P023-look3',
        modelCode: '25302401',
        name: 'SNAKE SCARF',
        category: 'ACCESSORIES',
        price: 26.9,
        image: '/products/web/snake-scarf-black.webp',
        pinPosition: {top: 75, left: 50},
        variants: [{id: 'P023-0', size: 'One Size'}],
      },
    ],
  },
];

export default function CatwalkLookbook({looks = BIGK_LOOKS}: {looks?: RunwayLook[]}) {
  const [currentLookIdx, setCurrentLookIdx] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const look = looks[currentLookIdx];

  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    looks.forEach((l) => {
      l.pieces.forEach((p) => {
        if (p.variants.length > 0) initial[p.id] = p.variants[0].size;
      });
    });
    return initial;
  });

  const [selectedPieces, setSelectedPieces] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    looks.forEach((l) => {
      l.pieces.forEach((p) => {
        initial[p.id] = true;
      });
    });
    return initial;
  });

  const togglePiece = (pieceId: string) => {
    setSelectedPieces((prev) => ({...prev, [pieceId]: !prev[pieceId]}));
  };

  const handleSelectSize = (pieceId: string, size: string) => {
    setSelectedSizes((prev) => ({...prev, [pieceId]: size}));
  };

  const activePieces = look.pieces.filter((p) => selectedPieces[p.id]);
  const totalPrice = activePieces.reduce((sum, p) => sum + p.price, 0);

  const handleAddFullLookToBag = () => {
    if (activePieces.length === 0) {
      alert('Select at least one piece.');
      return;
    }

    setIsAdding(true);

    try {
      const raw = localStorage.getItem('bigk-bag-v2');
      let currentBag: {variantId: string; quantity: number}[] = [];
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) currentBag = parsed;
        } catch {
          currentBag = [];
        }
      }

      activePieces.forEach((piece) => {
        const chosenSize = selectedSizes[piece.id] || piece.variants[0]?.size;
        const variantObj = piece.variants.find((v) => v.size === chosenSize) || piece.variants[0];
        if (!variantObj) return;
        const targetVariantId = variantObj.id;

        const existingIdx = currentBag.findIndex((b) => b.variantId === targetVariantId);
        if (existingIdx > -1) {
          currentBag[existingIdx].quantity = Math.min(5, currentBag[existingIdx].quantity + 1);
        } else {
          currentBag.push({variantId: targetVariantId, quantity: 1});
        }
      });

      localStorage.setItem('bigk-bag-v2', JSON.stringify(currentBag));
      // Notify other BigK UI that listens for bag updates
      window.dispatchEvent(new Event('bigk-cart-restored'));
      window.dispatchEvent(new Event('bigk-cart-change'));

      setIsAdding(false);
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2500);
    } catch (err) {
      console.error('Failed to add look to bag:', err);
      setIsAdding(false);
    }
  };

  return (
    <section className="bg-black text-white py-12 px-4 select-none">
      <div className="max-w-[500px] mx-auto">
        <div className="text-center mb-6">
          <span className="text-[10px] tracking-[0.2em] text-red-500 font-extrabold uppercase">Runway Lookbook</span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight mt-1 mb-1 text-white">Wear The Whole Look</h2>
          <p className="text-xs text-gray-400">Styled head to toe. Tap a dot or add the complete outfit in one go.</p>
        </div>

        <div className="relative rounded-2xl overflow-hidden bg-neutral-900 shadow-2xl border border-neutral-800">
          <div className="relative w-full h-[580px] bg-neutral-950">
            <img src={look.modelImage} alt={look.title} className="w-full h-full object-cover transition-opacity duration-300" />

            {look.pieces.map((piece, idx) => (
              <button
                key={piece.id}
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                style={{top: `${piece.pinPosition.top}%`, left: `${piece.pinPosition.left}%`}}
                className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 bg-white text-black font-black text-xs rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 z-10"
              >
                <span className="absolute inset-0 rounded-full border-2 border-white animate-ping opacity-75 pointer-events-none" />
                {idx + 1}
              </button>
            ))}

            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold px-3 py-1.5 rounded-full pointer-events-none z-10">
              Tap a dot to inspect the piece
            </div>

            <div className="absolute bottom-4 left-4 right-4 bg-neutral-900/90 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 flex items-center justify-between z-10">
              <button
                type="button"
                onClick={() => setCurrentLookIdx((prev) => (prev > 0 ? prev - 1 : looks.length - 1))}
                className="p-1 hover:text-red-400 transition"
                aria-label="Previous Look"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="text-[11px] font-bold text-gray-300">
                <span className="text-white font-black">{look.title}</span>
              </div>
              <button
                type="button"
                onClick={() => setCurrentLookIdx((prev) => (prev < looks.length - 1 ? prev + 1 : 0))}
                className="p-1 hover:text-red-400 transition"
                aria-label="Next Look"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div
            className={`absolute bottom-0 left-0 right-0 bg-neutral-900/98 backdrop-blur-xl border-t border-neutral-700 rounded-t-3xl p-4 transition-transform duration-300 ease-out z-20 ${
              isDrawerOpen ? 'translate-y-0' : 'translate-y-[calc(100%-62px)]'
            }`}
          >
            <div
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              className="w-10 h-1 bg-neutral-600 rounded-full mx-auto mb-3 cursor-pointer"
            />

            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs font-black text-white uppercase tracking-wider">In This Look</span>
                <span className="text-[10px] text-gray-400 ml-2">({activePieces.length} pieces selected)</span>
              </div>
              <button type="button" onClick={() => setIsDrawerOpen(false)} className="text-gray-400 hover:text-white transition">
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[240px] overflow-y-auto space-y-2 pr-1 mb-4">
              {look.pieces.map((piece) => {
                const isChecked = !!selectedPieces[piece.id];
                const activeSize = selectedSizes[piece.id] || piece.variants[0]?.size;

                return (
                  <div
                    key={piece.id}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition ${
                      isChecked ? 'bg-neutral-800/90 border-neutral-700' : 'bg-neutral-900/40 border-neutral-800 opacity-50'
                    }`}
                  >
                    <img
                      src={piece.image}
                      alt={piece.name}
                      className="w-12 h-12 object-cover rounded-lg bg-neutral-950 flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] font-extrabold text-red-500 uppercase">{piece.category}</div>
                      <div className="text-xs font-bold text-white truncate">{piece.name}</div>
                      <div className="text-xs font-black text-emerald-400 mt-0.5">€{piece.price.toFixed(2)}</div>

                      <div className="flex gap-1.5 mt-1.5 overflow-x-auto py-0.5">
                        {piece.variants.map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => handleSelectSize(piece.id, v.size)}
                            className={`px-2 py-0.5 text-[10px] font-bold rounded border transition ${
                              activeSize === v.size
                                ? 'bg-white text-black border-white'
                                : 'bg-neutral-900 text-gray-400 border-neutral-700 hover:border-gray-500'
                            }`}
                          >
                            {v.size}
                          </button>
                        ))}
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => togglePiece(piece.id)}
                      className="w-4 h-4 rounded accent-red-600 bg-neutral-950 border-neutral-700 cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleAddFullLookToBag}
              disabled={isAdding}
              className={`w-full py-3.5 px-5 rounded-full font-black text-xs flex items-center justify-between shadow-xl transition active:scale-[0.98] ${
                isAdded ? 'bg-emerald-500 text-white' : 'bg-white text-black hover:bg-neutral-200'
              }`}
            >
              <span className="flex items-center gap-2">
                {isAdded ? <Check size={16} /> : <ShoppingBag size={16} />}
                <span>{isAdded ? 'Added Full Look to Bag!' : 'Add Full Look To Bag'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-neutral-500 font-normal">·</span>
                <span className="text-sm font-black">€{totalPrice.toFixed(2)}</span>
                <span className="text-xs">→</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
