/**
 * BIG K ® customer-service agent: deterministic policy guard.
 * This function only suggests a workflow; it NEVER sends a message, reserves
 * inventory, issues a refund or creates a shipping label.
 */
export type SupportCase = {
  kind:'size_exchange'|'withdrawal'|'wrong_item'|'defect'|'lost_delivery'|'other';
  orderPaymentStatus:'paid'|'fulfilled'|'pending'|'demo'|'cancelled'|'expired'|'payment_review'|'other';
  daysSinceReceived:number|null;
  country:string;
  remoteArea:'yes'|'no'|'unknown';
  sameProductAndColor:boolean;
  replacementAvailable:boolean;
  priorFreeSizeExchange:boolean;
};
export type SupportDecision = {
  workflow:'exchange_draft'|'withdrawal_review'|'merchant_fault_review'|'delivery_review'|'human_review';
  allowedActions:('draft_reply'|'request_missing_information'|'prepare_exchange_request'|'request_warehouse_inspection')[];
  freeReplacementShipping:'eligible_after_warehouse_check'|'not_offered'|'human_review';
  humanApprovalRequired:boolean;
  reason:string;
};
const freeCountries=new Set(['BE','NL','LU','DE','FR']);
export function evaluateSupportCase(c:SupportCase):SupportDecision {
  const draft:SupportDecision['allowedActions']=['draft_reply','request_missing_information'];
  const review=(reason:string,workflow:SupportDecision['workflow']='human_review'):SupportDecision=>
    ({workflow,allowedActions:draft,freeReplacementShipping:'human_review',humanApprovalRequired:true,reason});
  if (!['paid','fulfilled'].includes(c.orderPaymentStatus))
    return review('Order is not confirmed as paid, or not available.');
  if (c.kind==='wrong_item'||c.kind==='defect')
    return review('Potential merchant responsibility: legal guarantee and transport-cost review.','merchant_fault_review');
  if (c.kind==='lost_delivery')
    return review('Shipping carrier investigation and customer rights require review.','delivery_review');
  if (c.kind==='withdrawal') {
    // No arbitrary 14-day hard reject: timing, proof and legal extensions are assessed separately.
    return review('Review receipt date, applicable consumer rights and refund of original standard shipping.','withdrawal_review');
  }
  if(c.kind!=='size_exchange')return review('Not covered by standard size exchange policy.');
  if(c.daysSinceReceived===null||c.daysSinceReceived<0)
    return review('Verified delivery date missing.');
  if(c.daysSinceReceived>14)
    return review('Standard size exchange window exceeded: review possible exceptions and legal rights.');
  if(!c.sameProductAndColor)
    return review('Variant differs beyond size: treat as non-standard exchange.');
  if(!c.replacementAvailable)
    return review('Requested size not available: offer withdrawal/refund or a supported alternative.');
  if(c.priorFreeSizeExchange)
    return review('One free replacement standard delivery per order has already been used.');
  if(!freeCountries.has(c.country.toUpperCase()))
    return review('Free replacement shipping is offered only in BE, NL, LU, DE and FR.');
  if(c.remoteArea!=='no')
    return review('Island/remote postcode is unverified or requires surcharge review.');
  return {
    workflow:'exchange_draft',
    allowedActions:[...draft,'prepare_exchange_request','request_warehouse_inspection'],
    freeReplacementShipping:'eligible_after_warehouse_check',
    humanApprovalRequired:true,
    reason:'Eligible for one merchant-funded replacement standard delivery after warehouse receives and approves the original item. Customer bears voluntary return postage.',
  };
}
