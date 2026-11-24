/** Authoritative customer shipping rates. Destinations expand only after carrier tariffs are verified. */
export const flatRateInternationalCountries = ['GB','CH','US','CA','AU'] as const;
export const checkoutCountries = ['BE','NL','FR','DE','LU','AT','CZ','ES','IT','PL','RO',...flatRateInternationalCountries] as const;
export type CheckoutCountry = typeof checkoutCountries[number];
export const checkoutCountryNames: Record<CheckoutCountry, string> = {
 BE:'Belgium', NL:'Netherlands', FR:'France', DE:'Germany', LU:'Luxembourg',
 AT:'Austria', CZ:'Czechia', ES:'Spain', IT:'Italy', PL:'Poland', RO:'Romania',
 GB:'United Kingdom', CH:'Switzerland', US:'United States', CA:'Canada', AU:'Australia',
};
const newMarketRates: Partial<Record<CheckoutCountry, number>> = {
 AT:1305, CZ:1437, ES:1241, IT:1178, PL:1052, RO:2100,
};
export function isCheckoutCountry(country:string):country is CheckoutCountry {
 return (checkoutCountries as readonly string[]).includes(country);
}
export function isFlatRateInternationalCountry(country:string):boolean {
 return (flatRateInternationalCountries as readonly string[]).includes(country);
}
const freeShippingPromotionEndsAt = Date.parse('2026-12-01T00:00:00+01:00');

export function freeShippingThreshold(country:string):number|null {
 if(!isCheckoutCountry(country))throw new RangeError('Shipping is not configured for this destination.');
 if(Date.now()<freeShippingPromotionEndsAt)return 0;
 if(isFlatRateInternationalCountry(country))return null;
 return country==='BE'||country==='NL'?6000:10000;
}
export function shippingCharge(subtotal:number,country:string='BE'):number {
 if(!Number.isSafeInteger(subtotal)||subtotal<0)throw new RangeError('Invalid shipping subtotal.');
 const threshold=freeShippingThreshold(country);
 if(threshold===null)return 1250;
 if(subtotal>=threshold)return 0;
 const rate=newMarketRates[country as CheckoutCountry];
 return rate===undefined?695:subtotal>=6000?Math.ceil(rate/2):rate;
}
