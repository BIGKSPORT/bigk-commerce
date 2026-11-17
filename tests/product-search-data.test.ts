import {test} from 'node:test';
import assert from 'node:assert/strict';
import {searchSku,searchDescription,searchShippingDetails} from '../lib/product-search-data';
test('search projection omits invalid optional SKU without inventing identifiers or changing source',()=>{
 assert.equal(searchSku('25302401-OS','P023-One Size'),'25302401-OS');
 for(const bad of ['P023-One Size','SKU\u00a0SIZE','SKU\nSIZE','SKU\u0000SIZE'])assert.equal(searchSku(bad,'id'),undefined);
 assert.equal(searchSku(undefined,'P023-One Size'),undefined);assert.equal(searchSku(undefined,'P023-OS'),'P023-OS');
 const source={description:'Original approved copy',content:{details:'More approved product details',localizedCopy:{description:'Beschrijving'}}};
 assert.equal(searchDescription(source as any),'Beschrijving');delete (source.content as any).localizedCopy;
 assert.equal(searchDescription(source as any),'More approved product details');assert.equal(source.description,'Original approved copy');
});

test('search shipping exactly matches the existing checkout countries and threshold',()=>{
 for(const [cents,rate] of [[2690,6.95],[9999,6.95],[10000,0],[14690,0]]){const offers=searchShippingDetails(cents);assert.deepEqual(offers.map(o=>o.shippingDestination.addressCountry),['BE','NL','FR','DE','LU']);assert(offers.every(o=>o.shippingRate.value===rate&&o.shippingRate.currency==='EUR'));}
});
