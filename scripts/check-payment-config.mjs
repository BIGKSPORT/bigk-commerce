// Report only credential classes and readiness booleans, never values or key names.
const key=process.env.STRIPE_SECRET_KEY||'';
const keyKind=/^(rk|sk)_test_/.test(key)?'test_server':/^(rk|sk)_live_/.test(key)?'live_server':/^pk_test_/.test(key)?'test_publishable_wrong_for_server':/^pk_live_/.test(key)?'live_publishable_wrong_for_server':key?'invalid_format':'missing';
console.log('PAYMENT_CONFIG_CHECK '+JSON.stringify({keyKind,webhookConfigured:!!process.env.STRIPE_WEBHOOK_SECRET,receiptConfigured:(process.env.RECEIPT_SECRET||'').length>=32,siteOriginConfigured:!!process.env.APP_URL,checkoutEnabled:process.env.COMMERCE_MODE==='live'&&process.env.LIVE_COMMERCE_APPROVED==='true'}));
// Opt-in, read-only sandbox credential probe. Never request live-mode resources.
if(process.env.STRIPE_STAGING_PROBE==='true'&&process.env.VERCEL_ENV==='preview'&&keyKind==='test_server'){
 let report={status:'unavailable'};
 try{
  const response=await fetch('https://api.stripe.com/v1/account',{headers:{Authorization:'Bearer '+key},signal:AbortSignal.timeout(12000)});
  if(response.ok){const account=await response.json();report={status:'authenticated',httpStatus:response.status,accountId:typeof account.id==='string'&&/^acct_[A-Za-z0-9]+$/.test(account.id)?account.id:undefined,chargesEnabled:account.charges_enabled===true,payoutsEnabled:account.payouts_enabled===true};}
  else if(response.status===403){await response.body?.cancel();const checkout=await fetch('https://api.stripe.com/v1/checkout/sessions?limit=1',{headers:{Authorization:'Bearer '+key},signal:AbortSignal.timeout(12000)});report={status:checkout.ok?'authenticated_checkout_read':'rejected',httpStatus:checkout.status};await checkout.body?.cancel();}
  else{report={status:'rejected',httpStatus:response.status};await response.body?.cancel();}
 }catch{report={status:'connection_failed'};}
 console.log('STRIPE_SANDBOX_PROBE '+JSON.stringify(report));
}
