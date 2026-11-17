import {salesQuote,salesRules} from './sales-pricing';
import type {SalesProduct} from './sales-types';
import type {B2BQuote} from './b2b-types';
export const b2bRules={firstMinimum:salesRules.firstMinimum,reorderMinimum:salesRules.reorderMinimum,freeShipping:50000,shipping:1250};
export function b2bQuote(catalogue:SalesProduct[],items:{variantId:string;quantity:number}[],hasPaidOrder:boolean):B2BQuote{
 const q=salesQuote(catalogue,items,2.5,'proforma',false),minimum=hasPaidOrder?b2bRules.reorderMinimum:b2bRules.firstMinimum;
 const shipping=q.subtotal>0&&q.subtotal<b2bRules.freeShipping?b2bRules.shipping:0,vat=Math.round((q.subtotal+shipping)*0.21);
 return {lines:q.lines,subtotal:q.subtotal,shipping,vat,total:q.subtotal+shipping+vat,minimum,minimumMet:q.subtotal>=minimum,units:q.units};
}
