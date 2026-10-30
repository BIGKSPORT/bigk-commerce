import Stripe from 'stripe';
/** Native fetch works in serverless runtimes and permits isolated transport fixtures. */
export function stripeClient(){
 const key=process.env.STRIPE_SECRET_KEY;
 if(!key)throw new Error('Stripe server credentials are not configured.');
 return new Stripe(key,{httpClient:Stripe.createFetchHttpClient(),timeout:15000,maxNetworkRetries:2});
}
