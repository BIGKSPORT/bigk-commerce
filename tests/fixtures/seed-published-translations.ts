import './seed-operations';
import {readFileSync,writeFileSync} from 'node:fs';
import {db,products} from '../../lib/db';
import {updateProduct} from '../../lib/admin-catalog';
const p=(await products()).find(p=>p.id==='P010')!;
await db().prepare('UPDATE variants SET stock=20,reserved=0 WHERE product_id=?').run(p.id);
await updateProduct({id:p.id,version:p.version,priceCents:9900,active:true,approved:true,variants:p.variants.map(v=>({...v,stock:20,reserved:0})),content:{...p.content!,composition:'Original verified fixture composition',details:'Original fixture details',care:'Follow the sewn-in label.',fit:'Regular fit',translations:{nl:{description:'Nederlandse sportkleding, klaar voor jouw dag.',composition:'Oorspronkelijke gecontroleerde teststof',details:'Nederlandse productdetails voor de browsertest.',seoTitle:'Nederlandse fixturetitel'}}}});
const fixture=JSON.parse(readFileSync(process.env.OPERATIONS_FIXTURE_PATH!,'utf8'));writeFileSync(process.env.OPERATIONS_FIXTURE_PATH!,JSON.stringify({...fixture,id:p.id,slug:p.slug,name:p.name}));
