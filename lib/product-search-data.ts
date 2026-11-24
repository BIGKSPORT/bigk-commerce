import {checkoutCountries,shippingCharge,type CheckoutCountry} from './shipping-policy';
import type {Product} from './types';
/** Search-only projection. Never rewrite warehouse identifiers to satisfy Google. */
export function searchSku(stored:string|undefined,variantId:string){
 const sku=stored||variantId;
 return sku&&!/[\p{White_Space}\p{Cc}\p{Cs}]/u.test(sku)?sku:undefined;
}
export function searchDescription(product:Product){return product.content?.localizedCopy?.description||product.content?.details||product.description;}

const transitDays: Partial<Record<CheckoutCountry, readonly [number, number]>> = {
 BE: [1, 1],
 NL: [2, 2],
 FR: [3, 3],
 DE: [3, 3],
};

export const searchReturnPolicy = {
 '@type': 'MerchantReturnPolicy',
 applicableCountry: checkoutCountries,
 returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
 merchantReturnDays: 14,
 returnMethod: 'https://schema.org/ReturnByMail',
 returnFees: 'https://schema.org/ReturnFeesCustomerResponsibility',
};

/** Use the checkout rate for a single item and the published carrier estimates. */
export function searchShippingDetails(priceCents: number) {
 return checkoutCountries.map(country => {
  const transit = transitDays[country] ?? [3, 5];
  return {
   '@type': 'OfferShippingDetails',
   shippingDestination: {'@type': 'DefinedRegion', addressCountry: country},
   shippingRate: {'@type': 'MonetaryAmount', value: shippingCharge(priceCents, country) / 100, currency: 'EUR'},
   deliveryTime: {
    '@type': 'ShippingDeliveryTime',
    transitTime: {'@type': 'QuantitativeValue', minValue: transit[0], maxValue: transit[1], unitCode: 'DAY'},
   },
  };
 });
}
