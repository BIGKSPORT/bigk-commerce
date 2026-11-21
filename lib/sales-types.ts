import type {CommissionStatement} from './sales-commissions';
export type SalesActor = {id:string;name:string;role:'owner'|'seller'};
export type SalesProduct = {modelId?:string;id:string;name:string;code:string;image:string;colour:string;size:string;available:number;retailCents:number;footwear:boolean;core:boolean};
export type SalesLine = SalesProduct & {quantity:number;unitCents:number};
export type SalesCustomer = {id:string;name:string;vat:string;contact:string;email:string;phone:string;address:string;creditApproved:boolean;hasPaidOrder:boolean;lastActivityAt:string|null;activeForCommission:boolean};
export type SalesQuote = {lines:SalesLine[];subtotal:number;vat:number;total:number;minimum:number;minimumMet:boolean;factor:2.5|2.7;factorEligible:boolean;commission:number;bonus:number;rate:number;units:number};
export type SalesOrder = {id:string;version:number;customerId:string;customerName:string;sellerId:string;sellerName:string;status:'draft'|'submitted'|'paid'|'cancelled';terms:'proforma'|'net30';quote:SalesQuote;earnedCents:number;createdAt:string;paymentReference:string};
export type SalesWorkspace = {commissions?:CommissionStatement[];preview?:{sellerId:string;sellerName:string;readOnly:true};actor:SalesActor;catalogue:SalesProduct[];models?:SalesModel[];customers:SalesCustomer[];orders:SalesOrder[];accounts?:{id:string;name:string;email:string;active:number}[];target?:{newStoresThisMonth:number;monthlyTarget:number;month:string}};

export type SalesModel={id:string;productId:string;name:string;category:string;categoryLabel:string;categoryActive:boolean;description:string;introduction?:string;composition:string;fit:string;care:string;details:string;sizeGuide:string;sizeTable:string;features:{id:string;heading:string;description:string;image:string;alt:string}[];colours:{id:string;name:string;article:string;images:string[];variantIds:string[]}[]};
