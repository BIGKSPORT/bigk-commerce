import {createHmac,timingSafeEqual} from 'node:crypto';
import {z} from 'zod';
import {HttpError} from './security';
export const revolutApiVersion='2024-09-01';
export function directRevolutReadiness(env:Readonly<Record<string,string|undefined>>=process.env){
 const mode=env.REVOLUT_MERCHANT_MODE==='live'?'live':'sandbox';
 return {stage:'prepared-not-connected',mode,enabled:env.REVOLUT_MERCHANT_ENABLED==='true',credentialsConfigured:!!env.REVOLUT_MERCHANT_SECRET_KEY?.trim(),webhookSecretConfigured:!!env.REVOLUT_MERCHANT_WEBHOOK_SECRET?.trim(),checkoutAvailable:false,remaining:['Persistent provider/order binding and idempotent settlement','Reservation expiry and cross-provider payment protection','Verified VAT and invoice support','Refund and dispute reconciliation','Sandbox end-to-end and owner acceptance']};
}
const orderInput=z.object({id:z.uuid(),total:z.number().int().min(1).max(100000000),email:z.email().max(254),receiptUrl:z.url()}).strict();
/** Future caller must supply the stored server-priced order, never a browser-supplied total. No network call or order mutation. */
export function preparedRevolutOrder(value:unknown,appOrigin:string){
 const order=orderInput.parse(value),redirect=new URL(order.receiptUrl),origin=new URL(appOrigin);
 if(origin.protocol!=='https:'&&origin.hostname!=='localhost'&&origin.hostname!=='127.0.0.1')throw new HttpError(400,'Use the configured secure storefront origin.');
 if(redirect.origin!==origin.origin||redirect.username||redirect.password||!/^\/(en|nl|fr|es|it)\/order$/.test(redirect.pathname))throw new HttpError(400,'Invalid payment return address.');
 return {amount:order.total,currency:'EUR',capture_mode:'automatic',description:'BIGK order '+order.id,customer:{email:order.email},merchant_order_data:{reference:order.id},redirect_url:redirect.href};
}
export function trustedRevolutCheckoutUrl(value:string,mode:'sandbox'|'live'){
 const url=new URL(value),host=mode==='live'?'checkout.revolut.com':'sandbox-checkout.revolut.com';
 if(url.protocol!=='https:'||url.hostname!==host||url.port||url.username||url.password||!url.pathname.startsWith('/payment-link/'))throw new HttpError(502,'Unexpected payment provider address.');
 return url.href;
}
/** Verify the exact raw request bytes. Receipt deduplication still belongs in the future persistent webhook handler. */
export function verifyRevolutSignature(raw:string,timestamp:string|null,signatures:string|null,secrets:string[],now=Date.now()){
 if(!timestamp||!/^\d{13}$/.test(timestamp)||Math.abs(now-Number(timestamp))>300000||!signatures||signatures.length>2048||!secrets.length||secrets.some(s=>!s))throw new HttpError(400,'Invalid payment notification.');
 const candidates=signatures.split(',').map(s=>s.trim()).filter(s=>/^v1=[a-f0-9]{64}$/i.test(s)).map(s=>Buffer.from(s.slice(3),'hex'));
 const valid=secrets.some(secret=>{const expected=createHmac('sha256',secret).update('v1.'+timestamp+'.'+raw).digest();return candidates.some(candidate=>timingSafeEqual(candidate,expected));});
 if(!valid)throw new HttpError(400,'Invalid payment notification.');
}
const payment=z.object({id:z.string().regex(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i),state:z.string(),amount:z.number().int().min(1),currency:z.string(),outstanding_amount:z.number().int().min(0),merchant_order_data:z.object({reference:z.string()})});
/** A verified payment alone is not permission to fulfil: tax, binding, stock and duplicate checks must also pass. */
export function verifyCompletedRevolutOrder(value:unknown,expected:{providerOrderId:string;orderId:string;total:number}){
 const parsed=payment.safeParse(value);
 if(!parsed.success)throw new HttpError(409,'Payment evidence is incomplete.');
 const p=parsed.data;
 if(p.id!==expected.providerOrderId||p.merchant_order_data.reference!==expected.orderId||p.state!=='completed'||p.currency!=='EUR'||p.amount!==expected.total||p.outstanding_amount!==0)throw new HttpError(409,'Payment evidence does not match the order.');
 return {providerOrderId:p.id,orderId:expected.orderId,total:p.amount,currency:'EUR' as const};
}

