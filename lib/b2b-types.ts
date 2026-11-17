import type {SalesLine,SalesModel,SalesProduct} from './sales-types';
export type B2BAccount={id:string;name:string;vat:string;email:string;contact:string;phone:string;address:string;postal:string;city:string;active:boolean;version:number;hasPaidOrder:boolean};
export type B2BQuote={lines:SalesLine[];subtotal:number;shipping:number;vat:number;total:number;minimum:number;minimumMet:boolean;units:number};
export type B2BOrder={id:string;accountId:string;version:number;status:'requested'|'confirmed'|'paid'|'fulfilled'|'cancelled';customer:B2BAccount;quote:B2BQuote;invoiceReference:string;paymentInstructions:string;paymentUrl:string;paymentReference:string;tracking:string;createdAt:string};
export type B2BWorkspace={account:B2BAccount;catalogue:SalesProduct[];models:SalesModel[];orders:B2BOrder[]};
export type B2BAdminData={accounts:B2BAccount[];orders:B2BOrder[]};
