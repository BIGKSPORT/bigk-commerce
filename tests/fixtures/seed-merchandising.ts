import './seed-operations';
import {readFileSync,writeFileSync} from 'node:fs';
import {db,products} from '../../lib/db';
const p=(await products()).find(p=>p.images.length&&!p.tags.some(t=>t.startsWith('alias:')))!;
await db().prepare('UPDATE products SET active=1,approved=1,price_cents=7900 WHERE id=?').run(p.id);
await db().prepare('UPDATE variants SET stock=20,reserved=0 WHERE product_id=?').run(p.id);
const fixture=JSON.parse(readFileSync(process.env.OPERATIONS_FIXTURE_PATH!,'utf8'));
writeFileSync(process.env.OPERATIONS_FIXTURE_PATH!,JSON.stringify({...fixture,productId:p.id,productImage:p.images[0]}));
