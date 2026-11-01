import {db,transaction,audit} from './db';
import {b10Product} from './b10';
import {canonicalGtin} from './product-identifiers';
/** Adds only a new B10 draft. Never overwrites a product. Stock follows the owner-confirmed size order. */
export async function importB10Draft(){return transaction(async()=>{
 if(process.env.DATABASE_SCHEMA!=='bigk_staging')throw Error('B10 import is development-only.');
 const p=b10Product(),existing=await db().prepare('SELECT id FROM products WHERE id=? OR slug=? OR code=?').get(p.id,p.slug,p.code);
 if(existing)throw Error('B10 already exists. Review it in the backoffice instead of reimporting.');
 const eans=new Set(Object.values(p.content!.trade!.identifiers!).map(v=>canonicalGtin(v.gtin)));
 for(const row of await db().prepare('SELECT content FROM product_content').all()){const content=JSON.parse(String(row.content));if(Object.values(content.trade?.identifiers||{}).some((v:any)=>v.gtin&&eans.has(canonicalGtin(v.gtin))))throw Error('A B10 EAN already belongs to an existing variant.');}
 await db().prepare('INSERT INTO products(id,slug,name,description,code,category,price_cents,approved,active,featured,images,tags,version) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').run(p.id,p.slug,p.name,p.description,p.code,p.category,p.priceCents,0,0,1,JSON.stringify(p.images),JSON.stringify(p.tags),0);
 for(const v of p.variants)await db().prepare('INSERT INTO variants(id,product_id,size,stock,reserved,reported) VALUES(?,?,?,?,?,?)').run(v.id,p.id,v.size,v.stock,0,null);
 await db().prepare('INSERT INTO product_content(product_id,content) VALUES(?,?)').run(p.id,JSON.stringify(p.content));
 await audit('catalog.b10_draft_added',p.id);
 return p.id;
})}
