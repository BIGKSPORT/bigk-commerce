import assert from 'node:assert/strict';
import test from 'node:test';
import {assessWarehouseReturn,type WarehouseInspection} from '../lib/warehouse-inspection';
const base:WarehouseInspection={
 reason:'size_exchange',orderVerified:true,scannedSkuMatches:true,scannedSizeMatches:true,
 receivedQuantity:1,expectedQuantity:1,sealedOrTriedOnOnly:true,
 damaged:false,hygieneOrSafetyConcern:false,photosRecorded:true,
};
test('matching undamaged return still requires stock and dispatch authorisation',()=>{
 const r=assessWarehouseReturn(base);
 assert.equal(r.disposition,'eligible_for_restock_review');
 assert.equal(r.exchangeCanShip,false);
 assert.equal(r.inventoryAdjustmentAllowed,false);
 assert.equal(r.refundAllowed,false);
});
test('wrong SKU or size is held and investigated',()=>{
 for(const patch of [{scannedSkuMatches:false},{scannedSizeMatches:false}]){
  assert.equal(assessWarehouseReturn({...base,...patch}).disposition,'mismatch_investigation');
 }
});
test('partial count is held',()=>{
 assert.equal(assessWarehouseReturn({...base,receivedQuantity:2}).disposition,'mismatch_investigation');
});
test('damage or hygiene concern requires review',()=>{
 for(const patch of [{damaged:true},{hygieneOrSafetyConcern:true}]){
  assert.equal(assessWarehouseReturn({...base,...patch}).disposition,'hold_for_review');
 }
});
test('opened packaging or wear should not automatically reject statutory withdrawal',()=>{
 const r=assessWarehouseReturn({...base,sealedOrTriedOnOnly:false,reason:'withdrawal'});
 assert.equal(r.disposition,'hold_for_review');
 assert.equal(r.refundAllowed,false);
});
test('no inspection photos leaves item on hold',()=>{
 assert.equal(assessWarehouseReturn({...base,photosRecorded:false}).disposition,'hold_for_review');
});
