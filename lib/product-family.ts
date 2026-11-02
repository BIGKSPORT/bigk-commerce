import type {Product} from './types';

import {family} from './product-groups';
export function supplierSku(product:Pick<Product,'code'>){return product.code.match(/\b\d{8}\b/)?.[0]||null}
export function productFamily(products:Product[],product:Product){return family(products,product)}
/** Supplier descriptions begin with the colour, followed by the garment specification. */
export function colourLabel(product:Pick<Product,'description'|'content'>){
 if(product.content?.trade?.colour)return product.content.trade.colour;
 const d=product.description.trim();
 const match=d.match(/^(black-cream|cream-black|dusty-blue|emerald green|black|cream|emerald)\b/i);
 if(!match)return 'Colour to confirm';
 return match[1].toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());
}
