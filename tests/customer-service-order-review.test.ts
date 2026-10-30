import assert from 'node:assert/strict';
import test from 'node:test';
import {inspectSizeExchange} from '../lib/customer-service-order-review';
import type {Order,Product} from '../lib/types';
const order:Order={
 id:'f7609851-f551-40b8-a443-0af8f0d487f7',status:'fulfilled',
 subtotal:10000,shipping:695,total:10695,currency:'eur',email:'buyer@example.org',phone:'+32400000000',
 createdAt:'2026-10-20T10:00:00Z',expiresAt:'2026-10-20T10:35:00Z',
 stripeSession:null,tracking:null,
 deliveryAddress:{name:'Test Buyer',address:'Example 1',postal:'2000',city:'Antwerp',country:'BE'},
 items:[{variantId:'var-m',name:'ALPINE FLEECE',size:'M',quantity:1,unitPrice:10000}],
};
const product:Product={
 id:'p1',name:'ALPINE FLEECE',code:'25303101',slug:'alpine-fleece',category:'jackets',
 description:'',priceCents:10000,approved:true,active:true,featured:false,version:1,
 tags:[],images:['/safe.jpg'],variants:[
 {id:'var-m',size:'M',stock:1,reserved:0,reported:null},
 {id:'var-l',size:'L',stock:4,reserved:1,reported:null},
 ],
};
test('loads true stock but never automatically approves an exchange',()=>{
 const r=inspectSizeExchange(order,'var-m','var-l',[product]);
 assert.equal(r.original.size,'M');
 assert.equal(r.requested?.size,'L');
 assert.equal(r.requested?.availableToSell,3);
 assert.equal(r.canReserveStock,false);
 assert.equal(r.canCreateReturnLabel,false);
 assert.equal(r.deliveryDateReviewRequired,true);
 assert.equal(r.postcodeReviewRequired,true);
 assert.equal(r.priorFreeExchangeReviewRequired,true);
 assert.equal(r.decision.workflow,'human_review');
 assert.equal(r.decision.humanApprovalRequired,true);
});
test('rejects an original SKU not purchased on this order',()=>{
 assert.throws(()=>inspectSizeExchange(order,'var-l','var-m',[product]),/does not belong/);
});
test('another product cannot be silently treated as a size exchange',()=>{
 const other={...product,id:'p2',code:'25303201',name:'ALPINE GILLET',variants:[{id:'other-l',size:'L',stock:20,reserved:0,reported:null}]};
 const r=inspectSizeExchange(order,'var-m','other-l',[product,other]);
 assert.equal(r.decision.workflow,'human_review');
});
test('reserved stock is deducted, zero available cannot be promised',()=>{
 const p={...product,variants:product.variants.map(v=>v.id==='var-l'?{...v,reserved:4}:v)};
 const r=inspectSizeExchange(order,'var-m','var-l',[p]);
 assert.equal(r.requested?.availableToSell,0);
 assert.equal(r.decision.workflow,'human_review');
});
test('unapproved product availability is zero',()=>{
 const r=inspectSizeExchange(order,'var-m','var-l',[{...product,approved:false}]);
 assert.equal(r.requested?.availableToSell,0);
});
test('demo orders do not qualify',()=>{
 const r=inspectSizeExchange({...order,status:'demo'},'var-m','var-l',[product]);
 assert.equal(r.decision.workflow,'human_review');
});
