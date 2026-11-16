export type SalesActor = {id:string;name:string;role:'owner'|'seller'};
export type SalesProduct = {id:string;name:string;code:string;image:string;colour:string;size:string;available:number;retailCents:number;footwear:boolean;core:boolean};
export type SalesLine = SalesProduct & {quantity:number;unitCents:number};
export type SalesCustomer = {id:string;name:string;vat:string;contact:string;email:string;phone:string;address:string;creditApproved:boolean;hasPaidOrder:boolean};
export type SalesQuote = {lines:SalesLine[];subtotal:number;vat:number;total:number;minimum:number;minimumMet:boolean;factor:2.5|2.7;factorEligible:boolean;commission:number;bonus:number;rate:number;units:number};
export type SalesOrder = {id:string;version:number;customerId:string;customerName:string;sellerId:string;sellerName:string;status:'draft'|'submitted'|'paid'|'cancelled';terms:'proforma'|'net30';quote:SalesQuote;earnedCents:number;createdAt:string;paymentReference:string};
export type SalesWorkspace = {preview?:{sellerId:string;sellerName:string;readOnly:true};actor:SalesActor;catalogue:SalesProduct[];customers:SalesCustomer[];orders:SalesOrder[];accounts?:{id:string;name:string;email:string;active:number}[]};
