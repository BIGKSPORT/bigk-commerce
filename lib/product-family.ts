import type {Product} from './types';

/** Supplier code: first six digits identify the garment family, last two the colourway. */
export function supplierSku(product:Pick<Product,'code'>){return product.code.match(/\b\d{8}\b/)?.[0]||null}
export function productFamily(products:Product[],product:Product){
 const sku=supplierSku(product);
 if(!sku)return [product];
 // Velvet WMS garments have distinct structures: do not group by the shared SKU prefix.
 if(sku.startsWith('250007'))return [product];
 return products.filter(p=>{const candidate=supplierSku(p);return candidate!==null&&candidate.slice(0,6)===sku.slice(0,6)})
  .filter((p,i,all)=>all.findIndex(other=>supplierSku(other)===supplierSku(p))===i);
}
/** Supplier descriptions begin with the colour, followed by the garment specification. */
export function colourLabel(product:Pick<Product,'description'>){
 const d=product.description.trim();
 const match=d.match(/^(black-cream|cream-black|dusty-blue|emerald green|black|cream|emerald)\b/i);
 if(!match)return 'Colour to confirm';
 return match[1].toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());
}
