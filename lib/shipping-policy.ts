/** Authoritative customer shipping rates. Destinations expand only after carrier tariffs are verified. */
export const checkoutCountries = ['BE','NL','FR','DE','LU','AT','CZ','ES','IT','PL','RO'] as const;
export type CheckoutCountry = typeof checkoutCountries[number];
export const checkoutCountryNames: Record<CheckoutCountry, string> = {
 BE:'Belgium', NL:'Netherlands', FR:'France', DE:'Germany', LU:'Luxembourg',
 AT:'Austria', CZ:'Czechia', ES:'Spain', IT:'Italy', PL:'Poland', RO:'Romania',
};
const newMarketRates: Partial<Record<CheckoutCountry, number>> = {
 AT:1305, CZ:1437, ES:1241, IT:1178, PL:1052, RO:2100,
};
export function isCheckoutCountry(country:string):country is CheckoutCountry {
 return (checkoutCountries as readonly string[]).includes(country);
}
export function freeShippingThreshold(country:string):number {
 if(!isCheckoutCountry(country))throw new RangeError('Shipping is not configured for this destination.');
 return country==='BE'||country==='NL'?6000:10000;
}
export function shippingCharge(subtotal:number,country:string='BE'):number {
 if(!Number.isSafeInteger(subtotal)||subtotal<0)throw new RangeError('Invalid shipping subtotal.');
 if(subtotal>=freeShippingThreshold(country))return 0;
 const rate=newMarketRates[country as CheckoutCountry];
 return rate===undefined?695:subtotal>=6000?Math.ceil(rate/2):rate;
}
