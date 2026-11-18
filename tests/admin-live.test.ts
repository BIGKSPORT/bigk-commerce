import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const dir = await mkdtemp(join(tmpdir(),'bigk-live-test-'));
Object.assign(process.env,{NODE_ENV:'test',DATABASE_PROVIDER:'sqlite',DATABASE_PATH:join(dir,'store.sqlite'),
  NEXT_PUBLIC_ADMIN_LIVE_VIEW_ENABLED:'true',ADMIN_LIVE_TEST_EMAILS:' test@example.test '});
delete process.env.VERCEL;
delete process.env.VERCEL_ENV;
const {db,closeDatabase} = await import('../lib/db');
const {operationsDb} = await import('../lib/operations-db');
const {brusselsDayStart,readAdminLive} = await import('../lib/admin-live');
const {hash} = await import('../lib/security');
const {GET} = await import('../app/api/admin/live/route');

try {
  const now = new Date('2026-10-25T12:00:00.000Z');
  assert.equal(brusselsDayStart(now),'2026-10-24T22:00:00.000Z');
  assert.equal(brusselsDayStart(new Date('2026-03-29T12:00:00.000Z')),'2026-03-28T23:00:00.000Z');

  const shopper = 'a'.repeat(64);
  await db().prepare('INSERT INTO customer_sessions(hash,email,expires_at) VALUES(?,?,?)')
    .run(hash(shopper),'shopper@example.test',new Date(Date.now()+60_000).toISOString());
  assert(await db().prepare('SELECT email FROM customer_sessions WHERE hash=? AND expires_at>?')
    .get(hash(shopper),new Date().toISOString()));
  for (const cookie of ['', 'bigk_customer='+shopper]) {
    const denied = await GET(new Request('http://localhost/api/admin/live',{headers:{Cookie:cookie}}));
    assert.equal(denied.status,401);
    assert.deepEqual(Object.keys(await denied.json()),['error']);
  }
  console.log('PASS access: signed-out requests and valid shopper sessions both receive HTTP 401 and no metrics.');

  const recent = '2026-10-25T11:45:00.000Z';
  const expires = '2026-10-26T00:00:00.000Z';
  const bag = db().prepare("INSERT INTO cart_sessions(id,items,stage,total,created_at,updated_at,expires_at,order_id) VALUES(?,'[]',?,?,?,?,?,?)");
  const order = db().prepare(`
    INSERT INTO orders(id,status,subtotal,shipping,total,email,phone,customer,receipt_hash,request_key,request_hash,created_at,expires_at)
    VALUES(?,?,12000,0,12000,?,'','{}','receipt',?,'request',?,?)
  `);
  await order.run('pending','pending','customer@example.test','pending',recent,expires);
  await order.run('test','pending','TEST@EXAMPLE.TEST','test',recent,expires);
  await order.run('paid','paid','customer@example.test','paid',recent,expires);
  await bag.run('bag','bag',12000,recent,recent,expires,null);
  await bag.run('checkout','checkout',12000,recent,recent,expires,null);
  await bag.run('linked','checkout',12000,recent,recent,expires,'pending');
  await bag.run('old','bag',12000,recent,'2026-10-25T11:00:00.000Z',expires,null);
  await db().prepare("INSERT INTO order_lines(order_id,variant_id,name,size,quantity,unit_price) VALUES('paid','P001-0','Item','S',2,6000)").run();
  await db().prepare("INSERT INTO audit(action,entity,created_at) VALUES('payment.confirmed','paid',?)").run(recent);
  const expected = {activeCarts:1,checkoutActivity:2,purchasedUnits:2,paidOrders:1,
    grossCents:12000,netCents:null,latestPaidAt:recent,sampledAt:now.toISOString()};
  assert.deepEqual(await readAdminLive(now),expected);

  await operationsDb().prepare("INSERT INTO order_invoices(order_id,number,snapshot,created_at) VALUES('paid','INV1',?,?)")
    .run(JSON.stringify({test:false,total:12000,tax:2000,net:10000}),recent);
  assert.deepEqual(await readAdminLive(now),{...expected,netCents:10000});
  console.log('PASS metrics: recent carts, checkout deduplication, test-order exclusion, Brussels date, paid units and verified VAT.');
} finally {
  await closeDatabase();
  await rm(dir,{recursive:true,force:true});
}
