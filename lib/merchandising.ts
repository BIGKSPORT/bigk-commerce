import {db,transaction,products} from './db';
import {databaseSchema,isPostgres} from './database';
import {db as sqlite} from './sqlite';
import {validProductImages} from './media';
import {HttpError} from './security';
import {operationAudit,ownerActor} from './operations-audit';
import {emptyMerchandising,merchandisingSchema,merchProductAvailable,publicMerchandising,type Merchandising} from './merchandising-content';
export const merchandisingTableSQL="CREATE TABLE IF NOT EXISTS storefront_merchandising(id TEXT PRIMARY KEY CHECK(id='homepage'),draft TEXT NOT NULL,published TEXT,version INTEGER NOT NULL DEFAULT 0,updated_at TEXT NOT NULL,published_at TEXT)";
function table(){if(!isPostgres())sqlite().exec(merchandisingTableSQL);return isPostgres()?databaseSchema()+'.storefront_merchandising':'storefront_merchandising';}
export async function merchandisingState(){const row=await db().prepare('SELECT draft,published,version,updated_at,published_at FROM '+table()+" WHERE id='homepage'").get();return {draft:row?merchandisingSchema.parse(JSON.parse(String(row.draft))):emptyMerchandising(),published:row?.published?merchandisingSchema.parse(JSON.parse(String(row.published))):null,version:Number(row?.version||0),updatedAt:row?String(row.updated_at):null,publishedAt:row?.published_at?String(row.published_at):null};}
async function validatePublish(doc:Merchandising){
 if(!doc.enabled)return;
 if(doc.announcement.enabled&&(!doc.announcement.copy.en.title||!doc.announcement.href))throw new HttpError(400,'The announcement needs English text and a destination.');
 if(doc.hero.enabled&&(!doc.hero.image||!doc.hero.href||!doc.hero.copy.en.title||!doc.hero.copy.en.button||doc.hero.copy.en.alt.length<5))throw new HttpError(400,'The banner needs a photo, English heading, button, destination and image description.');
 const catalog=await products();
 if(doc.organization?.enabled){const ids=new Set(catalog.filter(p=>!p.tags.some(t=>t.startsWith('alias:'))).map(p=>p.id));if(doc.organization.productOrder.some(id=>!ids.has(id)))throw new HttpError(400,'A product in the display order no longer exists. Reload the organizer.');}
 for(const shelf of doc.shelves.filter(s=>s.enabled)){
  if(!shelf.copy.en.title||!shelf.productIds.length)throw new HttpError(400,'Each enabled collection block needs an English heading and products.');
  if(new Set(shelf.productIds).size!==shelf.productIds.length)throw new HttpError(400,'Choose each product once per collection block.');
  for(const id of shelf.productIds)if(!catalog.some(p=>p.id===id&&merchProductAvailable(p)))throw new HttpError(400,'A collection product is unpublished, missing a photo or price, or has no available stock.');
 }
 if(doc.catalogMode==='curated'&&!doc.shelves.some(s=>s.enabled)&&!doc.looks.some(l=>l.enabled)&&!(doc.organization?.enabled&&doc.organization.categoryCards))throw new HttpError(400,'Add an enabled collection or look before choosing a curated homepage.');
 for(const look of doc.looks.filter(l=>l.enabled)){
  if(!look.image||!look.copy.en.title||look.copy.en.alt.length<5||!look.items.length)throw new HttpError(400,'Each enabled look needs a photo, English heading, image description and products.');
  if(new Set(look.items.map(i=>i.productId)).size!==look.items.length)throw new HttpError(400,'Choose each product once per look.');
  for(const item of look.items)if(!catalog.some(p=>p.id===item.productId&&merchProductAvailable(p)))throw new HttpError(400,'An outfit product is unpublished, missing a photo or price, or has no available stock. Update that look before publishing.');
 }
}
export async function writeMerchandising(action:'save'|'publish'|'disable',version:number,draft?:Merchandising){return transaction(async()=>{
 const state=await merchandisingState();if(state.version!==version)throw new HttpError(409,'The storefront changed in another session. Reload before saving.');
 let next=draft?merchandisingSchema.parse(draft):state.draft;
 if(action==='save'){
  const images=[next.hero.image,next.hero.mobileImage,...next.looks.map(l=>l.image)].filter(Boolean);await validProductImages([...new Set(images)]);
 }
 if(action==='publish')await validatePublish(next=state.draft);
 const now=new Date().toISOString();
 const published=action==='publish'?next:action==='disable'&&state.published?{...state.published,enabled:false}:state.published;
 await db().prepare('INSERT INTO '+table()+'(id,draft,published,version,updated_at,published_at) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET draft=excluded.draft,published=excluded.published,version=excluded.version,updated_at=excluded.updated_at,published_at=excluded.published_at').run('homepage',JSON.stringify(next),published?JSON.stringify(published):null,version+1,now,action==='publish'?now:state.publishedAt);
 await operationAudit(ownerActor,'storefront.'+action,'homepage',{version:version+1,enabled:published?.enabled||false,looks:next.looks.length});
 return merchandisingState();
});}
export async function storefrontMerchandising(catalog:Awaited<ReturnType<typeof products>>){const row=await db().prepare('SELECT published FROM '+table()+" WHERE id='homepage'").get();return row?.published?publicMerchandising(merchandisingSchema.parse(JSON.parse(String(row.published))),catalog):undefined;}
