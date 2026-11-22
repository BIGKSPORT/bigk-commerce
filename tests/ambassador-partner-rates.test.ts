import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PARTNER_LEVELS,defaultPartnerRate,assertPartnerRate} from '../lib/ambassadors';

test('BIG K® partner levels map to the published personal commission bands',()=>{
 assert.deepEqual(PARTNER_LEVELS,{starter:10,active:15,top:18,elite:20});
 assert.equal(defaultPartnerRate('starter'),10);
 assert.equal(defaultPartnerRate('active'),15);
 assert.equal(defaultPartnerRate('top'),18);
 assert.equal(defaultPartnerRate('elite'),20);
});
test('commission rates are bounded and stored to two decimal places',()=>{
 assert.equal(assertPartnerRate(10),10);
 assert.equal(assertPartnerRate(15.126),15.13);
 assert.throws(()=>assertPartnerRate(-0.01));
 assert.throws(()=>assertPartnerRate(20.01));
 assert.throws(()=>assertPartnerRate(Number.NaN));
});
