import './seed-operations';
import {readFileSync,writeFileSync} from 'node:fs';
import {db,products} from '../../lib/db';
for(const id of ['P001','P002','P006','P007','P010','P011']){await db().prepare('UPDATE products SET active=1,approved=1,price_cents=7900 WHERE id=?').run(id);await db().prepare('UPDATE variants SET stock=20,reserved=0 WHERE product_id=?').run(id);}
const catalog=await products(),fixture=JSON.parse(readFileSync(process.env.OPERATIONS_FIXTURE_PATH!,'utf8'));
writeFileSync(process.env.OPERATIONS_FIXTURE_PATH!,JSON.stringify({...fixture,moveName:catalog.find(p=>p.id==='P006')!.name,pinName:catalog.find(p=>p.id==='P011')!.name}));
