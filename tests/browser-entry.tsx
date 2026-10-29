import React from 'react';
import { createRoot } from 'react-dom/client';
import Storefront from '../components/storefront';
import seed from '../lib/catalog.json';
import type { Product } from '../lib/types';
const products=seed.products.map(p=>({...p,version:0,variants:p.variants.map(v=>({...v,reserved:0}))})) as Product[];
createRoot(document.getElementById('fixture')!).render(<Storefront products={products} mode="demo" ready={false}/>);
