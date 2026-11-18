/** Authoritative customer shipping rates. Destinations expand only after carrier tariffs are verified. */
export const checkoutCountries = ['BE','NL','FR','DE','LU'] as const;
export type CheckoutCountry = typeof checkoutCountries[number];
const shippingByCountry: Record<CheckoutCountry, {
 freeThresholdCents: number;
 transitDays: readonly [number, number];
}> = {
 BE: {freeThresholdCents: 6000, transitDays: [1, 1]},
 NL: {freeThresholdCents: 6000, transitDays: [1, 2]},
 FR: {freeThresholdCents: 10000, transitDays: [2, 3]},
 DE: {freeThresholdCents: 10000, transitDays: [2, 3]},
 LU: {freeThresholdCents: 10000, transitDays: [1, 1]},
};

export function shippingTransitDays(country: CheckoutCountry) {
 return shippingByCountry[country].transitDays;
}

export function isCheckoutCountry(country:string):country is CheckoutCountry {
 return (checkoutCountries as readonly string[]).includes(country);
}
export function freeShippingThreshold(country:string):number {
 if(!isCheckoutCountry(country))throw new RangeError('Shipping is not configured for this destination.');
 return shippingByCountry[country].freeThresholdCents;
}
export function shippingCharge(subtotal:number,country:string='BE'):number {
 if(!Number.isSafeInteger(subtotal)||subtotal<0)throw new RangeError('Invalid shipping subtotal.');
 return subtotal>=freeShippingThreshold(country)?0:695;
}
