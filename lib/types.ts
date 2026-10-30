export type Variant = {id:string;size:string;stock:number;reserved:number;reported:number|null};
export type ProductContent = {composition:string;care:string;fit:string;details:string};
export type Product = {version:number;content?:ProductContent;id:string;slug:string;name:string;description:string;code:string;category:string;priceCents:number|null;approved:boolean;active:boolean;featured:boolean;images:string[];variants:Variant[];tags:string[]};
export type CartLine = {variantId:string;quantity:number};
export type OrderStatus = 'demo'|'pending'|'paid'|'fulfilled'|'expired'|'cancelled'|'payment_review';
export type Order = {id:string;status:OrderStatus;pointsDiscount?:number;subtotal:number;shipping:number;total:number;currency:string;email:string;phone:string;createdAt:string;expiresAt:string;stripeSession:string|null;tracking:string|null;deliveryAddress:{name:string;address:string;postal:string;city:string;country:string};withdrawals?:{id:string;status:string;createdAt:string;items:{variantId:string;name:string;size:string;quantity:number}[]}[];items:{variantId?:string;name:string;size:string;quantity:number;unitPrice:number}[]};
