import {test} from 'node:test';
import assert from 'node:assert/strict';
import {searchSku,searchDescription,searchShippingDetails,searchReturnPolicy} from '../lib/product-search-data';
test('search projection omits invalid optional SKU without inventing identifiers or changing source',()=>{
 assert.equal(searchSku('25302401-OS','P023-One Size'),'25302401-OS');
 for(const bad of ['P023-One Size','SKU\u00a0SIZE','SKU\nSIZE','SKU\u0000SIZE'])assert.equal(searchSku(bad,'id'),undefined);
 assert.equal(searchSku(undefined,'P023-One Size'),undefined);assert.equal(searchSku(undefined,'P023-OS'),'P023-OS');
 const source={description:'Original approved copy',content:{details:'More approved product details',localizedCopy:{description:'Beschrijving'}}};
 assert.equal(searchDescription(source as any),'Beschrijving');delete (source.content as any).localizedCopy;
 assert.equal(searchDescription(source as any),'More approved product details');assert.equal(source.description,'Original approved copy');
});

test('search shipping follows the selected destination rather than a global threshold',()=>{
 for(const cents of [2690,5999,6000,6690,9999,10000,14690]){
  const offers=searchShippingDetails(cents);
  assert.deepEqual(offers.map(o=>o.shippingDestination.addressCountry),['BE','NL','FR','DE','LU']);
  assert.deepEqual(offers.map(({deliveryTime})=>[deliveryTime.transitTime.minValue,deliveryTime.transitTime.maxValue]),[[1,1],[1,2],[2,3],[2,3],[1,1]]);
  assert.deepEqual(searchReturnPolicy.applicableCountry,offers.map(o=>o.shippingDestination.addressCountry));
  for(const offer of offers){
   const threshold=['BE','NL'].includes(offer.shippingDestination.addressCountry)?6000:10000;
   assert.equal(offer.shippingRate.value,cents>=threshold?0:6.95);
   assert.equal(offer.shippingRate.currency,'EUR');
  }
 }
});
