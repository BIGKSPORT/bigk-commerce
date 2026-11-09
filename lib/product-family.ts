import type {Product} from './types';

import {family,rawColour} from './product-groups';
export function supplierSku(product:Pick<Product,'code'>){return product.code.match(/\b\d{8}\b/)?.[0]||null}
export function productFamily(products:Product[],product:Product){return family(products,product)}
/** Explicit colour metadata wins; reviewed supplier articles supply the fallback. */
export function colourLabel(product:Pick<Product,'description'|'content'>&Partial<Pick<Product,'code'>>){return rawColour(product)}
