import assert from 'node:assert/strict';
import test from 'node:test';
import {parseMyParcelCosts,readMyParcelCost} from '../lib/myparcel-costs';

test('reads integer cents from MyParcel Belgium historical shipment response',()=>{
  const result=parseMyParcelCosts({data:{shipments:[{
    id:12345,carrier_id:4,status:7,
    recipient:{cc:'BE',person:'REDACT',street:'PRIVATE',email:'SECRET'},
    price:{amount:467,currency:'EUR'},
    barcode:'TRACKING-SENSITIVE',
  }]}});
  assert.deepEqual(result,[{
    shipmentId:'12345',carrierId:4,destinationCountry:'BE',
    chargedCents:467,currency:'EUR',shipmentStatus:7,
  }]);
  assert.ok(!JSON.stringify(result).includes('REDACT'));
  assert.ok(!JSON.stringify(result).includes('SECRET'));
});
test('supports search_results structure and missing price',()=>{
  const result=parseMyParcelCosts({data:{search_results:{shipments:[{
    id:6789,carrier_id:2,recipient:{cc:'NL'}
  }]}}});
  assert.equal(result.length,1);
  assert.equal(result[0].chargedCents,null);
  assert.equal(result[0].destinationCountry,'NL');
});
test('rejects invalid IDs and malformed provider data',()=>{
  assert.deepEqual(parseMyParcelCosts({data:{shipments:[{id:'bad',price:{amount:20}}]}}),[]);
  assert.deepEqual(parseMyParcelCosts({data:{shipments:[{id:3,price:{amount:-1}}]}})[0].chargedCents,null);
});
test('rejects injection in shipment identifiers before any API calls',async()=>{
  await assert.rejects(readMyParcelCost('123?delete=1'),/Invalid MyParcel shipment ID/);
});
