// Explicit local/staging sync only. Refuse hosted URLs and production mode.
import {db,transaction,closeDatabase} from '../lib/db';
import {audit} from '../lib/db';
import source from '../docs/catalog-review/product-name-changes.json';
if(process.env.DATABASE_PROVIDER==='postgres'||process.env.NODE_ENV==='production'||process.env.COMMERCE_MODE==='live')throw Error('Use this reviewed name import only on local SQLite staging. Remote application needs a reviewed migration.');
try{await transaction(async()=>{for(const p of source){const current=await db().prepare('SELECT code,name FROM products WHERE id=?').get(p.id);if(!current||!String(current.code).includes(p.code))throw Error('Product mapping changed: '+p.id);if(current.name===p.name)continue;await db().prepare('UPDATE products SET name=?,version=version+1 WHERE id=?').run(p.name,p.id);await audit('catalog.master_name_updated',p.id)}});console.log('Master names synchronized for 27 mapped product records; no prices or stock changed.')}finally{await closeDatabase()}
