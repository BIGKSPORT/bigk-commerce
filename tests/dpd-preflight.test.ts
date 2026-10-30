import assert from 'node:assert/strict';
import test from 'node:test';
import {dpdPreflight, type DpdShipmentDraft} from '../lib/dpd-preflight';

const belgium: DpdShipmentDraft = {
  destinationCountry:'BE',destinationCity:'Brussels',recipientName:'Example Customer',
  recipientAddress:'Teststraat 1',recipientPostalCode:'1000',parcelGrossGrams:550,
  items:[{sku:'25303101',description:'Fleece jacket',quantity:1,unitValueCents:14690}],
};
const exportReady: DpdShipmentDraft = {
  ...belgium, destinationCountry:'GB',recipientEmail:'example@example.org',
  recipientPhone:'+441234567890',exporterEori:'BEEXAMPLE',
  invoiceNumber:'INV-TEST-1',invoiceCurrency:'EUR',invoiceIncoterm:'DAP',
  invoiceDocumentReady:true,
  items:[{...belgium.items[0],commodityCode:'62014010',originCountry:'CN',unitNetGrams:420}],
};
test('EU address passes local checks but never enables live labels',()=>{
  const result=dpdPreflight(belgium);
  assert.equal(result.completeForManualReview,true);
  assert.equal(result.destinationRequiresCustomsReview,false);
  assert.equal(result.canGenerateLiveLabel,false);
});
test('non-EU destination blocks missing item tariff code, origin and export documents',()=>{
  const result=dpdPreflight({...belgium,destinationCountry:'NO'});
  assert.equal(result.completeForManualReview,false);
  assert.equal(result.canGenerateLiveLabel,false);
  assert.ok(result.issues.some(i=>i.field==='items.0.commodityCode'));
  assert.ok(result.issues.some(i=>i.field==='items.0.originCountry'));
  assert.ok(result.issues.some(i=>i.code==='EXPORT_DOCUMENT_MISSING'));
});
test('two different SKUs can use separate tariff codes',()=>{
  const result=dpdPreflight({...exportReady,items:[
    exportReady.items[0],
    {...exportReady.items[0],sku:'25303201',description:'Sleeveless vest',commodityCode:'62114390'},
  ]});
  assert.equal(result.completeForManualReview,true);
  assert.equal(result.canGenerateLiveLabel,false);
});
test('a globally reused, absent or malformed tariff code does not get silently filled in',()=>{
  const result=dpdPreflight({...exportReady,items:[
    exportReady.items[0],{...exportReady.items[0],sku:'OTHER',commodityCode:''},
  ]});
  assert.ok(result.issues.some(i=>i.field==='items.1.commodityCode'));
  assert.equal(result.completeForManualReview,false);
});
test('export data complete still cannot generate live label until carrier approval',()=>{
  const result=dpdPreflight(exportReady);
  assert.equal(result.completeForManualReview,true);
  assert.equal(result.canGenerateLiveLabel,false);
});
test('rejects missing parcel weight even for EU',()=>{
  const result=dpdPreflight({...belgium,parcelGrossGrams:null});
  assert.ok(result.issues.some(i=>i.code==='GROSS_WEIGHT_MISSING'));
});
