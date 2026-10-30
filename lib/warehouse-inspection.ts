/** BIG K ® warehouse inspection policy. Pure logic; no database writes. */
export type WarehouseInspection = {
  reason:'size_exchange'|'withdrawal'|'wrong_item'|'defect'|'other';
  orderVerified:boolean;
  scannedSkuMatches:boolean;
  scannedSizeMatches:boolean;
  receivedQuantity:number;
  expectedQuantity:number;
  sealedOrTriedOnOnly:boolean;
  damaged:boolean;
  hygieneOrSafetyConcern:boolean;
  photosRecorded:boolean;
};
export type InspectionDecision = {
  disposition:'eligible_for_restock_review'|'hold_for_review'|'mismatch_investigation';
  exchangeCanShip:false;
  inventoryAdjustmentAllowed:false;
  refundAllowed:false;
  issues:string[];
};
export function assessWarehouseReturn(x:WarehouseInspection):InspectionDecision {
 const issues:string[]=[];
 if(!x.orderVerified)issues.push('Order/return authorisation not verified.');
 if(!x.scannedSkuMatches||!x.scannedSizeMatches)issues.push('Scanned item does not match authorised SKU and size.');
 if(!Number.isSafeInteger(x.receivedQuantity)||!Number.isSafeInteger(x.expectedQuantity)||
 x.receivedQuantity<=0||x.expectedQuantity<=0||x.receivedQuantity!==x.expectedQuantity)
 issues.push('Received item count differs from authorised return.');
 if(x.damaged)issues.push('Damage recorded; inspect condition and consumer rights before deciding.');
 if(x.hygieneOrSafetyConcern)issues.push('Hygiene or safety review required.');
 if(!x.photosRecorded)issues.push('Inspection photo evidence not yet recorded.');
 if(!x.sealedOrTriedOnOnly)issues.push('Product condition needs manual valuation; opened packaging alone is not a refusal reason.');
 const mismatch=!x.orderVerified||!x.scannedSkuMatches||!x.scannedSizeMatches||
 x.receivedQuantity!==x.expectedQuantity||x.receivedQuantity<=0||x.expectedQuantity<=0;
 return {disposition:mismatch?'mismatch_investigation':issues.length?'hold_for_review':'eligible_for_restock_review',
 exchangeCanShip:false,inventoryAdjustmentAllowed:false,refundAllowed:false,issues};
}
