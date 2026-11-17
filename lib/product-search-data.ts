import {shipping,checkoutSchema} from './commerce';
import type {Product} from './types';
/** Search-only projection. Never rewrite warehouse identifiers to satisfy Google. */
export function searchSku(stored:string|undefined,variantId:string){
 const sku=stored||variantId;
 return sku&&!/[\p{White_Space}\p{Cc}\p{Cs}]/u.test(sku)?sku:undefined;
}
export function searchDescription(product:Product){return product.content?.localizedCopy?.description||product.content?.details||product.description;}

/** Quote the existing single-item checkout rate, never a new shipping policy. */
export function searchShippingDetails(priceCents:number){return checkoutSchema.shape.country.options.map(country=>({'@type':'OfferShippingDetails',shippingDestination:{'@type':'DefinedRegion',addressCountry:country},shippingRate:{'@type':'MonetaryAmount',value:shipping(priceCents,country)/100,currency:'EUR'}}));}
