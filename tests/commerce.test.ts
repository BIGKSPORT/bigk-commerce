process.env.DATABASE_SCHEMA='bigk';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes, scryptSync } from 'node:crypto';
import Stripe from 'stripe';
import {stripeKeyMode} from '../lib/stripe-config';
import { db, products, transaction, closeDatabase } from '../lib/db';
import { checkoutSchema, createOrder, getOrder, verifyReceipt, shipping, settlePayment, cancelPayment, expireReservations, liveReady } from '../lib/commerce';
import { checkOrigin, passwordMatches, hash, requireAdmin, body } from '../lib/security';
import { POST as webhook } from '../app/api/webhooks/stripe/route';
import { GET as accountVerifyLanding, POST as accountVerify } from '../app/api/account/verify/route';
import { GET as accountMe } from '../app/api/account/me/route';
import { POST as accountRequest } from '../app/api/account/request/route';
import { PATCH as fulfilOrder } from '../app/api/admin/orders/route';
import { deliverEmails } from '../lib/email';
import { PATCH as updateCatalog } from '../app/api/admin/catalog/route';
// Never allow a developer's production DATABASE_URL into the destructive test suite.
const testDatabase = process.env.BIGK_TEST_DATABASE_URL;
if (testDatabase && (process.env.NODE_ENV !== 'test' || !['127.0.0.1', 'localhost', '[::1]'].includes(new URL(testDatabase).hostname))) throw new Error('PostgreSQL tests require a loopback test database.');
process.env.DATABASE_PROVIDER = testDatabase ? 'postgres' : 'sqlite';
process.env.DATABASE_URL = testDatabase || '';
const dir = mkdtempSync(join(tmpdir(), 'bigk-test-'));
process.env.DATABASE_PATH = join(dir, 'commerce.sqlite');
process.env.APP_URL = 'https://bigk.example';
process.env.RECEIPT_SECRET = randomBytes(32).toString('hex');
process.env.COMMERCE_MODE = 'demo';
async function input(variantId?: string) { return checkoutSchema.parse({ items: [{ variantId: variantId || (await products()).find(p => p.priceCents !== null)!.variants[0].id, quantity: 1 }], email: 'demo@example.test', phone: '+32470123456', firstName: 'Demo', lastName: 'Buyer', country: 'BE', address: 'Demo Street 1', postal: '1000', city: 'Brussels', consent: true, requestKey: crypto.randomUUID() }); }
function live() { process.env.COMMERCE_MODE = 'live'; process.env.LIVE_COMMERCE_APPROVED = 'true'; process.env.STRIPE_SECRET_KEY = 'sk_test_not_real'; process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_not_real'; }
async function activate(stock = 2) { const p = (await products()).find(p => p.priceCents !== null && p.images.length)!; (await db().prepare('UPDATE products SET active=1,approved=1 WHERE id=?').run(p.id)); (await db().prepare('UPDATE variants SET stock=? WHERE id=?').run(stock, p.variants[0].id)); return p.variants[0].id; }
await test('commerce integrity and protected operations', async (t) => {
    await t.test('imports original products without trusting reported stock', async () => { assert.equal((await products()).length, 27); assert((await products()).every(p => !p.active && !p.approved)); assert.equal((await products()).flatMap(p => p.variants).reduce((s, v) => s + v.stock, 0), 0); });
    await t.test('split size records resolve to canonical products with preserved variant IDs', async()=>{const catalog=await products();for(const [canonical,legacy] of [['P012','P013'],['P019','P020']]){const p=catalog.find(p=>p.id===canonical)!,old=catalog.find(p=>p.id===legacy)!;assert.equal(p.variants.length,6);assert.equal(old.variants.length,0);assert(old.tags.includes('alias:'+canonical));assert(p.variants.some(v=>v.id.startsWith(legacy+'-')))}});
    await t.test('restricted Stripe keys retain correct test/live isolation',()=>{assert.equal(stripeKeyMode('rk_test_example'),'test');assert.equal(stripeKeyMode('rk_live_example'),'live');assert.equal(stripeKeyMode('sk_test_example'),'test');assert.equal(stripeKeyMode('pk_live_example'),undefined)});
    await t.test('money uses integer cents and exact free-shipping boundary', () => { assert.equal(shipping(9999), 695); assert.equal(shipping(10000), 0); });
    await t.test('rejects malformed phones, client prices, quantities and unsupported destinations', async () => { const p = (await input()); assert(!checkoutSchema.safeParse({ ...p, phone: '0470 123 456' }).success); assert(!checkoutSchema.safeParse({ ...p, total: 1 }).success); assert(!checkoutSchema.safeParse({ ...p, items: [{ variantId: p.items[0].variantId, quantity: 0 }] }).success); assert(!checkoutSchema.safeParse({ ...p, country: 'US' }).success); });
    await t.test('demo creates immutable server-priced order without touching stock', async () => { const i = (await input()), r = (await createOrder(i)), o = (await getOrder(r.id))!; assert.equal(o.status, 'demo'); assert.equal(o.total, o.items[0].unitPrice + shipping(o.items[0].unitPrice)); assert((await verifyReceipt(r.id, r.receiptToken))); assert(!(await verifyReceipt(r.id, 'wrong'))); assert.equal((await products()).flatMap(p => p.variants).reduce((s, v) => s + v.reserved, 0), 0); const retry = (await createOrder(i)); assert.equal(retry.id, r.id); assert.equal(retry.receiptToken, r.receiptToken); (await assert.rejects(async () => (await createOrder({ ...i, phone: '+32470123457' })), /another request/)); });
    await t.test('duplicate bag variants are rejected', async () => { const i = (await input()); (await assert.rejects(async () => (await createOrder({ ...i, items: [...i.items, ...i.items] })), /Duplicate/)); });
    await t.test('live checkout fails closed until configured', async () => { process.env.COMMERCE_MODE = 'live'; assert(!liveReady()); (await assert.rejects(async () => (await createOrder((await input()))), /not configured/)); });
    let firstId = '', variant = '';
    await t.test('atomic reservations prevent overselling', async () => { live(); variant = (await activate(1)); const first = (await createOrder((await input(variant)))); firstId = first.id; assert.equal((await products()).flatMap(p => p.variants).find(v => v.id === variant)!.reserved, 1); (await assert.rejects(async () => (await createOrder((await input(variant)))), /not available/)); assert.equal((await db().prepare("SELECT COUNT(*) AS n FROM orders WHERE status='pending'").get())!.n, 1); });
    await t.test('signed payment settlement is idempotent and decrements stock once', async () => { (await db().prepare('UPDATE orders SET stripe_session=? WHERE id=?').run('cs_test_first', firstId)); const o = (await getOrder(firstId))!; assert.equal((await settlePayment('evt_1', firstId, 'cs_test_first', o.total, 'eur')), 'paid'); assert.equal((await settlePayment('evt_1', firstId, 'cs_test_first', o.total, 'eur')), 'duplicate'); assert.equal((await settlePayment('evt_2', firstId, 'cs_test_first', o.total, 'eur')), 'already-paid'); const v = (await products()).flatMap(p => p.variants).find(v => v.id === variant)!; assert.equal(v.stock, 0); assert.equal(v.reserved, 0); });
    await t.test('amount mismatch requires review and releases stock', async () => { (await activate(1)); const r = (await createOrder((await input(variant)))); (await db().prepare('UPDATE orders SET stripe_session=? WHERE id=?').run('cs_mismatch', r.id)); assert.equal((await settlePayment('evt_bad', r.id, 'cs_mismatch', 1, 'eur')), 'payment_review'); assert.equal((await products()).flatMap(p => p.variants).find(v => v.id === variant)!.reserved, 0); });
    await t.test('expired reservations release stock; late payments cannot auto-fulfill', async () => { const r = (await createOrder((await input(variant)))); (await db().prepare('UPDATE orders SET expires_at=?,stripe_session=? WHERE id=?').run('2000-01-01T00:00:00.000Z', 'cs_late', r.id)); (await expireReservations()); assert.equal((await getOrder(r.id))!.status, 'expired'); const newer = (await createOrder((await input(variant)))); assert.equal((await settlePayment('evt_late', r.id, 'cs_late', (await getOrder(r.id))!.total, 'eur')), 'payment_review'); assert.equal((await products()).flatMap(p => p.variants).find(v => v.id === variant)!.reserved, 1); (await db().prepare('UPDATE orders SET stripe_session=? WHERE id=?').run('cs_cancel', newer.id)); (await cancelPayment('evt_cancel', newer.id, 'cs_cancel')); (await cancelPayment('evt_cancel', newer.id, 'cs_cancel')); assert.equal((await getOrder(newer.id))!.status, 'cancelled'); assert.equal((await products()).flatMap(p => p.variants).find(v => v.id === variant)!.reserved, 0); });
    await t.test('webhooks reject invalid signatures and accept signed payment', async () => { const bad = await webhook(new Request('https://bigk.example/api/webhooks/stripe', { method: 'POST', headers: { 'stripe-signature': 'bad' }, body: '{}' })); assert.equal(bad.status, 400); const r = (await createOrder((await input(variant)))), o = (await getOrder(r.id))!; (await db().prepare('UPDATE orders SET stripe_session=? WHERE id=?').run('cs_signed', r.id)); const payload = JSON.stringify({ id: 'evt_signed', livemode:false, type: 'checkout.session.completed', data: { object: { id: 'cs_signed', livemode:false, metadata: { orderId: r.id }, payment_status: 'paid', amount_total: o.total, currency: 'eur' } } }); const stripe = new Stripe('sk_test_not_real'), signature = stripe.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET! }); const response = await webhook(new Request('https://bigk.example/api/webhooks/stripe', { method: 'POST', headers: { 'stripe-signature': signature }, body: payload })); assert.equal(response.status, 200); assert.equal((await getOrder(r.id))!.status, 'paid'); });
    await t.test('signed live events cannot settle orders in a Stripe test environment', async()=>{await db().prepare('UPDATE variants SET stock=stock+1 WHERE id=?').run(variant);const r=await createOrder(await input(variant)),o=(await getOrder(r.id))!;await db().prepare('UPDATE orders SET stripe_session=? WHERE id=?').run('cs_wrong_environment',r.id);const payload=JSON.stringify({id:'evt_wrong_environment',livemode:true,type:'checkout.session.completed',data:{object:{id:'cs_wrong_environment',livemode:true,metadata:{orderId:r.id},payment_status:'paid',amount_total:o.total,currency:'eur'}}});const stripe=new Stripe('sk_test_not_real'),signature=stripe.webhooks.generateTestHeaderString({payload,secret:process.env.STRIPE_WEBHOOK_SECRET!});const response=await webhook(new Request('https://bigk.example/api/webhooks/stripe',{method:'POST',headers:{'stripe-signature':signature},body:payload}));assert.equal(response.status,200);assert.equal((await getOrder(r.id))!.status,'pending');await cancelPayment('evt_test_cleanup',r.id,'cs_wrong_environment');});
    await t.test('origin, password verification and admin session isolation', async () => { assert.throws(() => checkOrigin(new Request('https://bigk.example/api/checkout', { headers: { origin: 'https://evil.example' } })), /origin rejected/); checkOrigin(new Request('https://bigk.example/api/checkout', { headers: { origin: 'https://bigk.example' } })); const salt = randomBytes(16).toString('hex'); process.env.ADMIN_PASSWORD_HASH = salt + ':' + scryptSync('a long unique password', salt, 64).toString('hex'); assert(passwordMatches('a long unique password')); assert(!passwordMatches('incorrect')); (await assert.rejects(async () => (await requireAdmin(new Request('https://bigk.example/api/admin/catalog'))), /Sign in/)); });
    await t.test('admin rejects unauthorized and stale writes', async () => { const p = (await products())[0]; const req = (cookie?: string, version = p.version) => new Request('https://bigk.example/api/admin/catalog', { method: 'PATCH', headers: { origin: 'https://bigk.example', 'Content-Type': 'application/json', ...(cookie ? { cookie: 'bigk_admin=' + cookie } : {}) }, body: JSON.stringify({ id: p.id, version, priceCents: p.priceCents, approved: p.approved, active: p.active, variants: p.variants.map(v => ({ id: v.id, stock: v.stock })) }) }); assert.equal((await updateCatalog(req())).status, 401); const value = randomBytes(32).toString('hex'); (await db().prepare('INSERT INTO sessions VALUES(?,?)').run(hash(value), new Date(Date.now() + 60000).toISOString())); assert.equal((await updateCatalog(req(value, 999))).status, 409); assert.equal((await updateCatalog(req(value))).status, 200); assert.equal((await updateCatalog(req(value))).status, 409); });
    await t.test('email confirmations are queued once for verified paid orders', async () => { const queued = (await db().prepare("SELECT COUNT(*) AS n FROM email_outbox WHERE kind='confirmation'").get()) as {
        n: number;
    }; assert.equal(queued.n, 2); });
    await t.test('customer sign-in is single use and only exposes matching orders', async () => { const value = randomBytes(32).toString('hex'); (await db().prepare('INSERT INTO login_tokens VALUES(?,?,?)').run(hash(value), 'demo@example.test', new Date(Date.now() + 60000).toISOString())); const landing=await accountVerifyLanding(new Request('https://bigk.example/api/account/verify?token='+value));assert.equal(landing.status,303);assert(landing.headers.get('location')!.includes('/account/confirm'));assert(await db().prepare('SELECT hash FROM login_tokens WHERE hash=?').get(hash(value)));const verified = await accountVerify(new Request('https://bigk.example/api/account/verify',{method:'POST',headers:{origin:'https://bigk.example','Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({token:value}).toString()})); assert.equal(verified.status, 303); const cookie = verified.headers.get('set-cookie')!; assert(cookie.includes('HttpOnly') && cookie.includes('SameSite=Strict')); const response = await accountMe(new Request('https://bigk.example/api/account/me', { headers: { cookie } })); assert.equal(response.status, 200); const data = await response.json(); assert.equal(data.email, 'demo@example.test'); assert(data.orders.every((o: {
        email: string;
    }) => o.email === 'demo@example.test')); const reused = await accountVerify(new Request('https://bigk.example/api/account/verify',{method:'POST',headers:{origin:'https://bigk.example','Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({token:value}).toString()})); assert(reused.headers.get('location')!.includes('error=expired')); assert.equal((await accountMe(new Request('https://bigk.example/api/account/me'))).status, 401); });
    await t.test('unconfigured customer email sign-in fails honestly', async () => { delete process.env.RESEND_API_KEY; const r = await accountRequest(new Request('https://bigk.example/api/account/request', { method: 'POST', headers: { origin: 'https://bigk.example', 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'demo@example.test' }) })); assert.equal(r.status, 503); });
    await t.test('fulfillment rejects unpaid orders and queues one shipment email', async () => { process.env.COMMERCE_MODE = 'demo'; const unpaid = (await createOrder((await input()))); const value = randomBytes(32).toString('hex'); (await db().prepare('INSERT INTO sessions VALUES(?,?)').run(hash(value), new Date(Date.now() + 60000).toISOString())); const req = (id: string) => new Request('https://bigk.example/api/admin/orders', { method: 'PATCH', headers: { origin: 'https://bigk.example', cookie: 'bigk_admin=' + value, 'Content-Type': 'application/json' }, body: JSON.stringify({ id, tracking: 'TRACK-DEMO-123' }) }); assert.equal((await fulfilOrder(req(unpaid.id))).status, 409); assert.equal((await fulfilOrder(req(firstId))).status, 200); assert.equal((await getOrder(firstId))!.status, 'fulfilled'); assert.equal((await fulfilOrder(req(firstId))).status, 409); assert.equal((await db().prepare("SELECT COUNT(*) AS n FROM email_outbox WHERE kind='shipment'").get())!.n, 1); });
    await t.test('email outbox retries failures and marks successful deliveries', async () => { process.env.RESEND_API_KEY = 'test-not-real'; process.env.EMAIL_FROM = 'BigK <demo@example.test>'; const original = globalThis.fetch; try {
        globalThis.fetch = async () => new Response('{}', { status: 500 });
        const failed = await deliverEmails();
        assert.equal(failed.failed, 3);
        assert.equal(failed.sent, 0);
        (await db().prepare('UPDATE email_outbox SET next_attempt=0').run());
        globalThis.fetch = async () => new Response('{}', { status: 200 });
        const success = await deliverEmails();
        assert.equal(success.sent, 3);
        assert.equal((await deliverEmails()).sent, 0);
    }
    finally {
        globalThis.fetch = original;
    } });
    await t.test('request bodies are size limited and malformed JSON is rejected', async () => { await assert.rejects(() => body(new Request('https://bigk.example', { method: 'POST', body: 'a'.repeat(32769) })), /too large/); await assert.rejects(() => body(new Request('https://bigk.example', { method: 'POST', body: '{' })), /Invalid JSON/); });
    await t.test('concurrent checkouts reserve the final unit only once', async () => {
        live(); const variant = await activate(1);
        const results = await Promise.allSettled([createOrder(await input(variant)), createOrder(await input(variant))]);
        assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
        const rejected = results.find(r => r.status === 'rejected') as PromiseRejectedResult;
        assert.match(rejected.reason.message, /not available/);
        const v = (await products()).flatMap(p => p.variants).find(v => v.id === variant)!;
        assert.equal(v.reserved, 1);
    });
    await t.test('failed async transactions roll back all inventory changes', async () => {
        const p = (await products())[0]; const before = p.version;
        await assert.rejects(() => transaction(async () => {
            await db().prepare('UPDATE products SET version=version+1 WHERE id=?').run(p.id);
            await Promise.resolve(); throw new Error('rollback check');
        }), /rollback check/);
        assert.equal((await products())[0].version, before);
    });

});
await closeDatabase();
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
