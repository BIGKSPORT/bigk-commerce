/** Authoritative customer shipping rates. Destinations expand only after carrier tariffs are verified. */
export const checkoutCountries = ['BE','NL','FR','DE','LU'] as const;
export type CheckoutCountry = typeof checkoutCountries[number];
export function isCheckoutCountry(country:string):country is CheckoutCountry {
 return (checkoutCountries as readonly string[]).includes(country);
}
export function freeShippingThreshold(country:string):number {
 if(!isCheckoutCountry(country))throw new RangeError('Shipping is not configured for this destination.');
 return country==='BE'||country==='NL'?6000:10000;
}
export function shippingCharge(subtotal:number,country:string='BE'):number {
 if(!Number.isSafeInteger(subtotal)||subtotal<0)throw new RangeError('Invalid shipping subtotal.');
 return subtotal>=freeShippingThreshold(country)?0:695;
}
