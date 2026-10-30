import type {Order,Product} from './types';
import {evaluateSupportCase,type SupportDecision} from './customer-service-policy';

/** Trusted order/catalog inputs, but NO proof of delivery or postcode classification. */
export type ExchangeReadiness = {
  orderId:string;
  original:{variantId:string;name:string;size:string;quantity:number};
  requested:{variantId:string;name:string;size:string;availableToSell:number}|null;
  country:string;
  postcodeReviewRequired:true;
  deliveryDateReviewRequired:true;
  priorFreeExchangeReviewRequired:true;
  canReserveStock:false;
  canCreateReturnLabel:false;
  decision:SupportDecision;
};
export function inspectSizeExchange(
  order:Order,
  originalVariantId:string,
  requestedVariantId:string,
  catalog:Product[],
):ExchangeReadiness {
  const original=order.items.find(i=>i.variantId===originalVariantId);
  if(!original)throw new Error('Original variant does not belong to this order.');
  const originalProduct=catalog.find(p=>p.variants.some(v=>v.id===originalVariantId));
  const requestedProduct=catalog.find(p=>p.variants.some(v=>v.id===requestedVariantId));
  const variant=requestedProduct?.variants.find(v=>v.id===requestedVariantId);
  // Avoid cross-product and same-size swaps being suggested as regular size exchanges.
  const sameProduct=!!originalProduct && !!requestedProduct &&
    originalProduct.id===requestedProduct.id &&
    originalVariantId!==requestedVariantId &&
    original.size!==variant?.size;
  const available=variant&&requestedProduct?.approved&&requestedProduct.active&&requestedProduct.images.length
    ? Math.max(0,variant.stock-variant.reserved) : 0;
  const decision=evaluateSupportCase({
    kind:'size_exchange',orderPaymentStatus:order.status,
    daysSinceReceived:null, // Must be verified separately, never substitute order creation date.
    country:order.deliveryAddress.country,
    remoteArea:'unknown', // MUST confirm against actual postcode tariff rules.
    sameProductAndColor:sameProduct,
    replacementAvailable:available>=original.quantity,
    priorFreeSizeExchange:true, // Until a durable prior-exchange ledger can be checked.
  });
  return {
    orderId:order.id,
    original:{variantId:originalVariantId,name:original.name,size:original.size,quantity:original.quantity},
    requested:variant&&requestedProduct?{variantId:variant.id,name:requestedProduct.name,size:variant.size,availableToSell:available}:null,
    country:order.deliveryAddress.country,
    postcodeReviewRequired:true,deliveryDateReviewRequired:true,
    priorFreeExchangeReviewRequired:true,
    canReserveStock:false,canCreateReturnLabel:false,decision,
  };
}
