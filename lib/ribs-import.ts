import {db,products,transaction,audit} from './db';
import {ribsProducts} from './ribs';
import {canonicalGtin} from './product-identifiers';
/** Repeatable development-only insert. Existing records are validated and never overwritten. */
export async function importRibsDrafts(){if(process.env.DATABASE_SCHEMA!=='bigk_staging')throw Error('RIBS import is development-only.');return transaction(async()=>{
 const catalog=await products(),added:string[]=[];
 for(const p of ribsProducts()){
  const existing=catalog.find(other=>other.id===p.id||other.code===p.code||other.slug===p.slug);if(existing){if(existing.id!==p.id||existing.code!==p.code)throw Error('Existing RIBS identity conflict');continue;}
  const eans=new Set(Object.values(p.content!.trade!.identifiers!).map(value=>canonicalGtin(value.gtin)));
  if(catalog.some(other=>Object.values(other.content?.trade?.identifiers||{}).some(value=>value.gtin&&eans.has(canonicalGtin(value.gtin)))))throw Error('A RIBS EAN already belongs to another product');
  await db().prepare('INSERT INTO products(id,slug,name,description,code,category,price_cents,approved,active,featured,images,tags,version) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').run(p.id,p.slug,p.name,p.description,p.code,p.category,p.priceCents,0,0,0,JSON.stringify(p.images),JSON.stringify(p.tags),0);
  for(const v of p.variants)await db().prepare('INSERT INTO variants(id,product_id,size,stock,reserved,reported) VALUES(?,?,?,?,?,?)').run(v.id,p.id,v.size,0,0,null);
  await db().prepare('INSERT INTO product_content(product_id,content) VALUES(?,?)').run(p.id,JSON.stringify(p.content));added.push(p.id);catalog.push(p);
 }
 if(added.length)await audit('catalog.ribs_drafts_added',added.join(','));return added;
})}
