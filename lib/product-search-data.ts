import {checkoutCountries,shippingCharge,shippingTransitDays} from './shipping-policy';
import type {Product} from './types';
/** Search-only projection. Never rewrite warehouse identifiers to satisfy Google. */
export function searchSku(stored:string|undefined,variantId:string){
 const sku=stored||variantId;
 return sku&&!/[\p{White_Space}\p{Cc}\p{Cs}]/u.test(sku)?sku:undefined;
}
export function searchDescription(product:Product){return product.content?.localizedCopy?.description||product.content?.details||product.description;}

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
  const [minValue, maxValue] = shippingTransitDays(country);
  return {
   '@type': 'OfferShippingDetails',
   shippingDestination: {'@type': 'DefinedRegion', addressCountry: country},
   shippingRate: {'@type': 'MonetaryAmount', value: shippingCharge(priceCents, country) / 100, currency: 'EUR'},
   deliveryTime: {
    '@type': 'ShippingDeliveryTime',
    transitTime: {'@type': 'QuantitativeValue', minValue, maxValue, unitCode: 'DAY'},
   },
  };
 });
}
