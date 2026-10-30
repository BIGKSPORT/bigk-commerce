// Report only credential classes and readiness booleans, never values or key names.
const key=process.env.STRIPE_SECRET_KEY||'';
const keyKind=/^(rk|sk)_test_/.test(key)?'test_server':/^(rk|sk)_live_/.test(key)?'live_server':/^pk_test_/.test(key)?'test_publishable_wrong_for_server':/^pk_live_/.test(key)?'live_publishable_wrong_for_server':key?'invalid_format':'missing';
console.log('PAYMENT_CONFIG_CHECK '+JSON.stringify({keyKind,webhookConfigured:!!process.env.STRIPE_WEBHOOK_SECRET,receiptConfigured:(process.env.RECEIPT_SECRET||'').length>=32,siteOriginConfigured:!!process.env.APP_URL,checkoutEnabled:process.env.COMMERCE_MODE==='live'&&process.env.LIVE_COMMERCE_APPROVED==='true'}));
