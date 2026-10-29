import type {Product} from './types';
export function productFamily(products:Product[],product:Product){const name=product.name.toLowerCase().replace(/\s+/g,' ').trim();return products.filter(p=>p.name.toLowerCase().replace(/\s+/g,' ').trim()===name).filter((p,i,all)=>all.findIndex(other=>(other.code.match(/\d{8}$/)?.[0]||other.code)===(p.code.match(/\d{8}$/)?.[0]||p.code))===i)}
