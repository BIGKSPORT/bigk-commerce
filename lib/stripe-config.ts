export function stripeKeyMode(key=process.env.STRIPE_SECRET_KEY||''):'live'|'test'|undefined{
 if(/^(sk|rk)_live_/.test(key))return 'live';
 if(/^(sk|rk)_test_/.test(key))return 'test';
}
