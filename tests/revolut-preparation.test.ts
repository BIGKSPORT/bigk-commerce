import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {preparedRevolutOrder,trustedRevolutCheckoutUrl,verifyRevolutSignature,verifyCompletedRevolutOrder,directRevolutReadiness} from '../lib/revolut-preparation';
const id='6616e61c-d279-4454-a837-bc52ce55ed49',provider='7616e61c-d279-4454-a837-bc52ce55ed49';
test('direct Revolut stays unavailable while preparation is unconnected',()=>{
 const status=directRevolutReadiness({REVOLUT_MERCHANT_ENABLED:'true',REVOLUT_MERCHANT_MODE:'live',REVOLUT_MERCHANT_SECRET_KEY:'fixture-only',REVOLUT_MERCHANT_WEBHOOK_SECRET:'fixture-only'});
 assert.equal(status.checkoutAvailable,false);assert.equal(status.credentialsConfigured,true);assert(!JSON.stringify(status).includes('fixture-only'));assert(status.remaining.some(x=>x.includes('VAT')));
});
test('prepared order keeps server total and blocks foreign receipt destinations',()=>{
 const input={id,total:14690,email:'fixture@example.test',receiptUrl:'https://bigk.be/nl/order#fixture'};
 const value=preparedRevolutOrder(input,'https://bigk.be');assert.equal(value.amount,14690);assert.equal(value.currency,'EUR');assert.equal(value.capture_mode,'automatic');assert.equal(value.merchant_order_data.reference,id);
 for(const receiptUrl of ['https://evil.example/nl/order','https://bigk.be.evil.example/nl/order','https://bigk.be/nl/checkout','https://user:password@bigk.be/nl/order'])assert.throws(()=>preparedRevolutOrder({...input,receiptUrl},'https://bigk.be'));
 assert.throws(()=>preparedRevolutOrder({...input,total:-1},'https://bigk.be'));
 assert.throws(()=>preparedRevolutOrder({...input,total:1.5},'https://bigk.be'));
 assert.throws(()=>trustedRevolutCheckoutUrl('https://checkout.revolut.com.evil.example/payment-link/fixture','live'));
 assert.throws(()=>trustedRevolutCheckoutUrl('https://sandbox-checkout.revolut.com/payment-link/fixture','live'));
 assert.equal(trustedRevolutCheckoutUrl('https://checkout.revolut.com/payment-link/fixture','live'),'https://checkout.revolut.com/payment-link/fixture');
});
test('raw webhook authentication rejects tampering, stale/future timestamps and malformed signatures',()=>{
 const now=1794310000000,ts=String(now),raw=JSON.stringify({event:'ORDER_COMPLETED',order_id:provider}),secret='wsk_fixture_only';
 const sign=(body:string,timestamp=ts)=>'v1='+createHmac('sha256',secret).update('v1.'+timestamp+'.'+body).digest('hex');
 verifyRevolutSignature(raw,ts,sign(raw),[secret],now);
 verifyRevolutSignature(raw,ts,'v1='+'0'.repeat(64)+','+sign(raw),['old-fixture',secret],now);
 for(const [body,timestamp,signature,keys] of [[raw+' ',ts,sign(raw),[secret]],[raw,String(now-300001),sign(raw,String(now-300001)),[secret]],[raw,String(now+300001),sign(raw,String(now+300001)),[secret]],[raw,ts,'v1=abc',[secret]],[raw,ts,sign(raw),[]]] as [string,string,string,string[]][])assert.throws(()=>verifyRevolutSignature(body,timestamp,signature,keys,now));
});
test('only exact completed EUR evidence is accepted, never merely authorised',()=>{
 const expected={providerOrderId:provider,orderId:id,total:14690},evidence={id:provider,state:'completed',amount:14690,currency:'EUR',outstanding_amount:0,merchant_order_data:{reference:id}};
 assert.equal(verifyCompletedRevolutOrder(evidence,expected).total,14690);
 for(const patch of [{state:'authorised'},{state:'pending'},{amount:1},{currency:'GBP'},{outstanding_amount:1},{id},{merchant_order_data:{reference:'unbound'}}])assert.throws(()=>verifyCompletedRevolutOrder({...evidence,...patch},expected));
});
