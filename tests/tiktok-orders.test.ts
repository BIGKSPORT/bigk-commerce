import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes} from 'node:crypto';
import {GET} from '../app/api/integrations/tiktok/orders/route';
import {adminSessionHash,seal} from '../lib/admin-mfa';
import {db,closeDatabase} from '../lib/db';

test('TikTok order review is admin-only and omits customer information', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bigk-tiktok-orders-'));
  process.env.DATABASE_PROVIDER = 'sqlite';
  process.env.DATABASE_PATH = join(dir, 'store.sqlite');
  process.env.ADMIN_MFA_KEY = randomBytes(32).toString('hex');
  process.env.ADMIN_MFA_REQUIRED = 'true';
  process.env.TIKTOK_SHOP_APP_KEY = 'app-fixture';
  process.env.TIKTOK_SHOP_APP_SECRET = 'secret-fixture';
  const session = randomBytes(32).toString('hex');
  const originalFetch = globalThis.fetch;
  try {
    await db().prepare('CREATE TABLE IF NOT EXISTS tiktok_shop_connection(id TEXT PRIMARY KEY, credentials TEXT)').run();
    await db().prepare('INSERT INTO tiktok_shop_connection VALUES(?,?)').run('belgium', seal({access_token: 'access-fixture'}));
    await db().prepare('INSERT INTO sessions VALUES(?,?)').run(adminSessionHash(session), new Date(Date.now()+60000).toISOString());
    let calls = 0;
    globalThis.fetch = async (input, init) => {
      calls++;
      const url = new URL(String(input));
      assert.equal(url.hostname, 'open-api.tiktokglobalshop.com');
      assert.match(url.searchParams.get('sign') || '', /^[a-f0-9]{64}$/);
      if (url.pathname === '/authorization/202309/shops') {
        return Response.json({code: 0, data: {shops: [{name: 'BIG K', region: 'BE', cipher: 'shop-fixture'}]}});
      }
      assert.equal(url.pathname, '/order/202309/orders/search');
      assert.equal(init?.method, 'POST');
      assert.deepEqual(JSON.parse(String(init?.body)), {order_status: 'AWAITING_SHIPMENT'});
      assert.equal(url.searchParams.get('shop_cipher'), 'shop-fixture');
      assert.equal(url.searchParams.get('page_token'), 'cursor-fixture');
      return Response.json({code: 0, data: {orders: [{
        id: 'order-fixture', status: 'AWAITING_SHIPMENT', shipping_type: 'SELLER',
        rts_sla_time: 1795519234, is_buyer_request_cancel: true,
        recipient_address: {name: 'private-fixture'},
        line_items: [{id: 'item-fixture', seller_sku: 'SKU-1'}],
      }], next_page_token: 'next-fixture'}});
    };
    const endpoint = 'https://bigk.test/api/integrations/tiktok/orders?page=cursor-fixture';
    assert.equal((await GET(new Request(endpoint))).status, 401);
    assert.equal(calls, 0);
    const response = await GET(new Request(endpoint, {headers: {cookie: 'bigk_admin='+session}}));
    assert.equal(response.status, 200);
    assert.match(response.headers.get('Cache-Control') || '', /no-store/);
    assert.deepEqual(await response.json(), {
      shop: 'BIG K', nextPage: 'next-fixture', orders: [{
        id: 'order-fixture', status: 'AWAITING_SHIPMENT', shippingType: 'SELLER',
        dispatchDeadline: 1795519234, cancellationRequested: true,
        items: [{id: 'item-fixture', name: null, sku: 'SKU-1', variant: null}],
      }],
    });
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = originalFetch;
    await closeDatabase();
    await rm(dir, {recursive: true, force: true});
  }
});
