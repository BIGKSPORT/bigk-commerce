import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import catalog from './catalog.json';
import {withdrawalSchema} from './withdrawal-schema';
import {mediaSchema} from './media-schema';
import {backofficeSchema} from './backoffice-schema';
import {clubSchema} from './club-schema';
import type { Product } from './types';
let instance: DatabaseSync | undefined;
export function db(){
 if(instance)return instance;
 const path=resolve(process.env.DATABASE_PATH||'data/bigk.sqlite');mkdirSync(dirname(path),{recursive:true,mode:0o700});
 const sql=new DatabaseSync(path);sql.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
 CREATE TABLE IF NOT EXISTS products(id TEXT PRIMARY KEY,slug TEXT UNIQUE NOT NULL,name TEXT NOT NULL,description TEXT NOT NULL,code TEXT NOT NULL,category TEXT NOT NULL,price_cents INTEGER CHECK(price_cents>=0),approved INTEGER NOT NULL DEFAULT 0,active INTEGER NOT NULL DEFAULT 0,featured INTEGER NOT NULL DEFAULT 0,images TEXT NOT NULL,tags TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 0);
 CREATE TABLE IF NOT EXISTS variants(id TEXT PRIMARY KEY,product_id TEXT NOT NULL REFERENCES products(id),size TEXT NOT NULL,stock INTEGER NOT NULL DEFAULT 0 CHECK(stock>=0),reserved INTEGER NOT NULL DEFAULT 0 CHECK(reserved>=0 AND reserved<=stock),reported INTEGER);
 CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY,status TEXT NOT NULL,subtotal INTEGER NOT NULL,shipping INTEGER NOT NULL,total INTEGER NOT NULL,currency TEXT NOT NULL DEFAULT 'eur',email TEXT NOT NULL,phone TEXT NOT NULL,customer TEXT NOT NULL,receipt_hash TEXT NOT NULL,request_key TEXT UNIQUE NOT NULL,request_hash TEXT NOT NULL,created_at TEXT NOT NULL,expires_at TEXT NOT NULL,stripe_session TEXT UNIQUE,tracking TEXT);
 CREATE TABLE IF NOT EXISTS order_lines(id INTEGER PRIMARY KEY,order_id TEXT NOT NULL REFERENCES orders(id),variant_id TEXT NOT NULL REFERENCES variants(id),name TEXT NOT NULL,size TEXT NOT NULL,quantity INTEGER NOT NULL CHECK(quantity>0),unit_price INTEGER NOT NULL CHECK(unit_price>=0));
 CREATE TABLE IF NOT EXISTS webhook_events(id TEXT PRIMARY KEY,created_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY,expires_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS rate_limits(key TEXT PRIMARY KEY,hits INTEGER NOT NULL,expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY,action TEXT NOT NULL,entity TEXT NOT NULL,created_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS login_tokens(hash TEXT PRIMARY KEY,email TEXT NOT NULL,expires_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS customer_sessions(hash TEXT PRIMARY KEY,email TEXT NOT NULL,expires_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS email_outbox(id INTEGER PRIMARY KEY,order_id TEXT NOT NULL REFERENCES orders(id),kind TEXT NOT NULL,email TEXT NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,next_attempt INTEGER NOT NULL DEFAULT 0,lease_until INTEGER NOT NULL DEFAULT 0,sent_at TEXT,UNIQUE(order_id,kind));
 PRAGMA user_version=1;`);
 sql.exec(clubSchema);
 sql.exec(backofficeSchema);
 sql.exec(mediaSchema);
 sql.exec(withdrawalSchema);
 instance=sql;
 if(!(sql.prepare('SELECT COUNT(*) AS n FROM products').get() as {n:number}).n){transaction(()=>{for(const p of catalog.products){sql.prepare('INSERT INTO products(id,slug,name,description,code,category,price_cents,approved,active,featured,images,tags) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(p.id,p.slug,p.name,p.description,p.code,p.category,p.priceCents,0,0,p.featured?1:0,JSON.stringify(p.images),JSON.stringify(p.tags));if(p.content)sql.prepare('INSERT INTO product_content(product_id,content) VALUES(?,?)').run(p.id,JSON.stringify(p.content));for(const v of p.variants)sql.prepare('INSERT INTO variants(id,product_id,size,stock,reported) VALUES(?,?,?,?,?)').run(v.id,p.id,v.size,0,v.reported)}})}
 return sql;
}
export function transaction<T>(fn:()=>T):T{const sql=db();sql.exec('BEGIN IMMEDIATE');try{const value=fn();sql.exec('COMMIT');return value}catch(e){sql.exec('ROLLBACK');throw e}}
export function products():Product[]{const sql=db();return (sql.prepare('SELECT * FROM products ORDER BY featured DESC,rowid').all() as Record<string,unknown>[]).map(p=>({version:Number(p.version),id:String(p.id),slug:String(p.slug),name:String(p.name),description:String(p.description),code:String(p.code),category:String(p.category),priceCents:p.price_cents===null?null:Number(p.price_cents),approved:!!p.approved,active:!!p.active,featured:!!p.featured,images:JSON.parse(String(p.images)),tags:JSON.parse(String(p.tags)),variants:(sql.prepare('SELECT * FROM variants WHERE product_id=? ORDER BY rowid').all(String(p.id)) as Record<string,unknown>[]).map(v=>({id:String(v.id),size:String(v.size),stock:Number(v.stock),reserved:Number(v.reserved),reported:v.reported===null?null:Number(v.reported)}))}))}
export function audit(action:string,entity:string){db().prepare('INSERT INTO audit(action,entity,created_at) VALUES(?,?,?)').run(action,entity,new Date().toISOString())}
