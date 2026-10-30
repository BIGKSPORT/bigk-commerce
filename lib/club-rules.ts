// Shared, integer-only rules. Amounts follow the existing inclusive-tax checkout.
export type ClubLine = {id:string;grossCents:number;promotionCents?:number;kind:'product'|'gift_card'|'event_ticket'};
export function clubQuote(lines:ClubLine[],points=0,promotionCoupon=false){
 if(!Number.isSafeInteger(points)||points<0||points%100!==0)throw Error('Use points in steps of 100.');
 if(points&&promotionCoupon)throw Error('Points cannot be combined with a promotional coupon.');
 const eligible=lines.filter(l=>l.kind==='product').reduce((n,l)=>{if(!Number.isSafeInteger(l.grossCents)||!Number.isSafeInteger(l.promotionCents||0)||l.grossCents<0||(l.promotionCents||0)<0||(l.promotionCents||0)>l.grossCents)throw Error('Invalid product amount.');return n+l.grossCents-(l.promotionCents||0)},0);
 const maximumPoints=Math.floor(eligible/10/300)*100,discountCents=points/100*300;
 if(points>maximumPoints)throw Error('Points discount exceeds 10% of eligible products.');
 return {eligibleCents:eligible,maximumPoints,discountCents,expectedPoints:Math.floor((eligible-discountCents)/100),taxBasis:'inclusive' as const};
}
export function productKind(tags:string[]):ClubLine['kind']{return tags.includes('gift_card')?'gift_card':tags.includes('event_ticket')?'event_ticket':'product'}
export function addMonthsUTC(date:string,months:number){const d=new Date(date),day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+months);const last=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();d.setUTCDate(Math.min(day,last));return d.toISOString()}
