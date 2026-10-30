import assert from 'node:assert/strict';
import test from 'node:test';
import {evaluateSupportCase,type SupportCase} from '../lib/customer-service-policy';
const base:SupportCase={
 kind:'size_exchange',orderPaymentStatus:'fulfilled',daysSinceReceived:5,
 country:'BE',remoteArea:'no',sameProductAndColor:true,
 replacementAvailable:true,priorFreeSizeExchange:false,
};
test('same product, new size, paid mainland order: draft only',()=>{
 const d=evaluateSupportCase(base);
 assert.equal(d.workflow,'exchange_draft');
 assert.equal(d.freeReplacementShipping,'eligible_after_warehouse_check');
 assert.equal(d.humanApprovalRequired,true);
 assert.ok(!d.allowedActions.includes('issue_refund' as never));
});
test('known island and unknown remote postcode always require review',()=>{
 for(const remoteArea of ['yes','unknown'] as const){
  const d=evaluateSupportCase({...base,remoteArea});
  assert.equal(d.workflow,'human_review');
  assert.equal(d.freeReplacementShipping,'human_review');
 }
});
test('do not promise extra free exchange',()=>{
 assert.equal(evaluateSupportCase({...base,priorFreeSizeExchange:true}).workflow,'human_review');
});
test('no available replacement cannot be reserved',()=>{
 assert.equal(evaluateSupportCase({...base,replacementAvailable:false}).workflow,'human_review');
});
test('wrong item uses merchant-fault process, not customer-paid size exchange',()=>{
 const d=evaluateSupportCase({...base,kind:'wrong_item'});
 assert.equal(d.workflow,'merchant_fault_review');
});
test('withdrawal never automatically denied based on age',()=>{
 const d=evaluateSupportCase({...base,kind:'withdrawal',daysSinceReceived:22});
 assert.equal(d.workflow,'withdrawal_review');
});
test('outside core countries cannot offer free replacement',()=>{
 assert.equal(evaluateSupportCase({...base,country:'ES'}).freeReplacementShipping,'human_review');
});
test('demo and pending orders cannot receive free label promises',()=>{
 for(const orderPaymentStatus of ['demo','pending'] as const)
  assert.equal(evaluateSupportCase({...base,orderPaymentStatus}).workflow,'human_review');
});
