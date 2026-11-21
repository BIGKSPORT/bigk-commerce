import type {SalesProduct,SalesQuote} from './sales-types';
export const salesRules={firstMinimum:120000,reorderMinimum:30000,factorThreshold:200000,openingBonus:10000,proformaRate:0.12,reorderRate:0.08,monthlyNewStoreTarget:3,activeCustomerDays:60};
// All money is integer euro cents. The owner's factor convention divides VAT-inclusive RRP
// by the factor to obtain the VAT-exclusive wholesale unit price.
export function salesQuote(catalogue:SalesProduct[],items:{variantId:string;quantity:number}[],factor:2.5|2.7,terms:'proforma'|'net30',firstOrder:boolean,activeRepeatOrder=false):SalesQuote {
 const selected=items.map(i=>{const p=catalogue.find(p=>p.id===i.variantId);if(!p||!Number.isInteger(i.quantity)||i.quantity<1||i.quantity>10000)throw Error('Ongeldig product of aantal.');return {p,quantity:i.quantity};});
 if(new Set(items.map(i=>i.variantId)).size!==items.length)throw Error('Dubbele maatregel.');
 const base=selected.reduce((n,{p,quantity})=>n+(p.core&&!p.footwear?Math.round(p.retailCents/2.5)*quantity:0),0);
 const factorEligible=base>=salesRules.factorThreshold;
 const appliedFactor=factor===2.7&&factorEligible?2.7:2.5;
 const lines=selected.map(({p,quantity})=>({...p,quantity,unitCents:Math.round(p.retailCents/(p.footwear?2.2:appliedFactor))}));
 const subtotal=lines.reduce((n,p)=>n+p.unitCents*p.quantity,0),vat=Math.round(subtotal*0.21),minimum=firstOrder?salesRules.firstMinimum:salesRules.reorderMinimum;
 const rate=firstOrder?(terms==='proforma'?salesRules.proformaRate:salesRules.reorderRate):(activeRepeatOrder?salesRules.reorderRate:0);
 const bonus=firstOrder&&subtotal>=salesRules.firstMinimum?salesRules.openingBonus:0;
 return {lines,subtotal,vat,total:subtotal+vat,minimum,minimumMet:subtotal>=minimum,factor:appliedFactor,factorEligible,commission:Math.round(subtotal*rate)+bonus,bonus,rate,units:items.reduce((n,i)=>n+i.quantity,0)};
}
