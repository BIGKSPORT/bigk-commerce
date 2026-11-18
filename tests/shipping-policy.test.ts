import {test} from 'node:test';
import assert from 'node:assert/strict';
import {checkoutCountries,freeShippingThreshold,shippingCharge} from '../lib/shipping-policy';
test('BE/NL free shipping starts at exactly €60, other configured countries at €100',()=>{
 for(const cc of checkoutCountries.slice(0,5)){
  const limit=cc==='BE'||cc==='NL'?6000:10000;
  assert.equal(freeShippingThreshold(cc),limit);
  assert.equal(shippingCharge(limit-1,cc),695);
  assert.equal(shippingCharge(limit,cc),0);
  assert.equal(shippingCharge(limit+1,cc),0);
 }
});
test('unconfigured destinations including Norway never inherit a cheap or free rate',()=>{
 for(const cc of ['NO','US','GB','ZZ',''])assert.throws(()=>shippingCharge(100000,cc),RangeError);
 for(const subtotal of [-1,NaN,Infinity,60.1])assert.throws(()=>shippingCharge(subtotal,'BE'),RangeError);
});
test('promotional discounts can move an order below its country threshold',()=>{
 assert.equal(shippingCharge(6600,'BE'),0);
 assert.equal(shippingCharge(6600-660,'BE'),695);
 assert.equal(shippingCharge(11000-1100,'FR'),695);
});

import {shippingCopy} from '../lib/i18n/shipping-copy';
import {translateSite} from '../lib/i18n/site-copy';
test('every shipping policy entry has NL FR ES IT translations and is wired to the site',()=>{
 for(const [en,translations] of Object.entries(shippingCopy))for(const locale of ['nl','fr','es','it'] as const){
  assert(translations[locale].trim().length>0);
  assert.notEqual(translations[locale],en);
  assert.equal(translateSite(locale,en),translations[locale]);
 }
});

test('new EU markets charge half from €60 and offer free delivery from €100',()=>{
 for(const [country,rate] of Object.entries({AT:1305,CZ:1437,ES:1241,IT:1178,PL:1052,RO:2100})){
  assert.equal(shippingCharge(5999,country),rate);
  assert.equal(shippingCharge(6000,country),Math.ceil(rate/2));
  assert.equal(shippingCharge(9999,country),Math.ceil(rate/2));
  assert.equal(shippingCharge(10000,country),0);
 }
});
