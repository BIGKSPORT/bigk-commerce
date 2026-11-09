import './seed-operations';
import {importB10Draft} from '../../lib/b10-import';
import {readFileSync,writeFileSync} from 'node:fs';
import {db,products} from '../../lib/db';
if(process.env.DATABASE_PROVIDER!=='sqlite'||!process.env.DATABASE_PATH?.includes('bigk-organization-browser-'))throw Error('Disposable organization fixture only.');
await importB10Draft();
for(const id of ['B10','P001','P002','P006','P007','P010','P011','P023','P024','P025']){await db().prepare('UPDATE products SET active=1,approved=1,price_cents=7900 WHERE id=?').run(id);await db().prepare('UPDATE variants SET stock=20,reserved=0 WHERE product_id=?').run(id);}
await db().prepare("UPDATE catalog_categories SET active=0 WHERE name='Fleece'").run();
await db().prepare("UPDATE products SET price_cents=14690 WHERE id IN ('P001','P002')").run();
const catalog=await products(),fixture=JSON.parse(readFileSync(process.env.OPERATIONS_FIXTURE_PATH!,'utf8'));
writeFileSync(process.env.OPERATIONS_FIXTURE_PATH!,JSON.stringify({...fixture,moveName:catalog.find(p=>p.id==='P006')!.name,pinName:catalog.find(p=>p.id==='P011')!.name}));
