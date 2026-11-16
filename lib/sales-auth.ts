import {createHmac,randomBytes,scryptSync} from 'node:crypto';
import QRCode from 'qrcode';
import {transaction} from './db';
import {salesDb as db} from './sales-db';
import {base32,counterFor,seal,unseal} from './admin-mfa';
import {cookieValue,hash,HttpError,passwordMatches,requireAdmin,sessionCookie,token} from './security';
import type {SalesActor} from './sales-types';
export function requireSalesEnabled(){if(process.env.SELLER_PORTAL_ENABLED!=='true')throw new HttpError(404,'Het verkopersportaal is nog niet ingeschakeld.');}
export async function salesEvent(actor:SalesActor,action:string,entity:string){await db().prepare('INSERT INTO seller_events(id,actor_id,action,entity,created_at) VALUES(?,?,?,?,?)').run(crypto.randomUUID(),actor.id,action,entity,new Date().toISOString());}
export async function salesActor(req:Request,ownerOnly=false):Promise<SalesActor>{
 requireSalesEnabled();
 try{await requireAdmin(req);return {id:'owner',name:'BIG K',role:'owner'};}catch(e){if(!(e instanceof HttpError)||e.status!==401)throw e;}
 if(ownerOnly)throw new HttpError(403,'Alleen de eigenaar kan dit beheren.');
 const value=cookieValue(req,'bigk_seller');if(!value)throw new HttpError(401,'Log in met je verkopersaccount.');
 const row=await db().prepare('SELECT a.id,a.name FROM seller_sessions s JOIN seller_accounts a ON a.id=s.seller_id WHERE s.hash=? AND s.expires_at>? AND a.active=1 AND s.account_version=a.version').get(hash('seller:'+value),new Date().toISOString());
 if(!row)throw new HttpError(401,'Je sessie is verlopen. Log opnieuw in.');return {id:String(row.id),name:String(row.name),role:'seller'};
}
export async function inviteSeller(actor:SalesActor,name:string,email:string){return transaction(async()=>{
 const id=crypto.randomUUID(),value=token();
 if(await db().prepare('SELECT id FROM seller_accounts WHERE email=?').get(email.toLowerCase()))throw new HttpError(409,'Dit e-mailadres bestaat al. Gebruik Toegang herstellen.');
 await db().prepare('INSERT INTO seller_accounts(id,name,email,invite_hash,invite_expires,created_at) VALUES(?,?,?,?,?,?)').run(id,name,email.toLowerCase(),hash('seller-invite:'+value),new Date(Date.now()+30*60000).toISOString(),new Date().toISOString());
 await salesEvent(actor,'seller.invited',id);return {setupPath:'/staff/sales/setup#'+value};
});}
export async function changeSeller(actor:SalesActor,id:string,action:'disable'|'reset'){return transaction(async()=>{
 if(!await db().prepare('SELECT id FROM seller_accounts WHERE id=?').get(id))throw new HttpError(404,'Verkoper niet gevonden.');
 const value=action==='reset'?token():null;
 await db().prepare('UPDATE seller_accounts SET active=?,version=version+1,password_hash=NULL,secret_encrypted=NULL,last_counter=-1,invite_hash=?,invite_expires=? WHERE id=?').run(value?1:0,value?hash('seller-invite:'+value):null,value?new Date(Date.now()+30*60000).toISOString():null,id);
 await db().prepare('DELETE FROM seller_sessions WHERE seller_id=?').run(id);await salesEvent(actor,'seller.'+action,id);return value?{setupPath:'/staff/sales/setup#'+value}:{ok:true};
});}
async function invited(value:string){if(!/^[A-Za-z0-9_-]{40,100}$/.test(value))throw new HttpError(400,'Ongeldige uitnodiging.');const row=await db().prepare('SELECT id,email FROM seller_accounts WHERE invite_hash=? AND invite_expires>? AND active=1').get(hash('seller-invite:'+value),new Date().toISOString());if(!row)throw new HttpError(410,'Deze uitnodiging is verlopen of gebruikt. Vraag een nieuwe link.');return row;}
function setupSecret(value:string){const key=process.env.ADMIN_MFA_KEY||'';if(!/^[a-f0-9]{64}$/.test(key))throw new HttpError(503,'Beveiliging is niet geconfigureerd.');return base32(createHmac('sha256',Buffer.from(key,'hex')).update('seller-setup:'+value).digest().subarray(0,20));}
export async function beginSellerSetup(value:string){requireSalesEnabled();const row=await invited(value),secret=setupSecret(value);return {secret,qr:await QRCode.toDataURL('otpauth://totp/'+encodeURIComponent('BIG K Sales:'+row.email)+'?secret='+secret+'&issuer=BIG%20K%20Sales&algorithm=SHA1&digits=6&period=30',{width:220,margin:2})};}
export async function finishSellerSetup(value:string,password:string,code:string){requireSalesEnabled();return transaction(async()=>{
 const row=await invited(value),secret=setupSecret(value),counter=counterFor(secret,code);
 if(password.length<16||password.length>256)throw new HttpError(400,'Gebruik een wachtwoord van 16 tot 256 tekens.');if(counter===null)throw new HttpError(400,'Gebruik de nieuwste authenticatorcode.');
 const salt=randomBytes(16).toString('hex');await db().prepare('UPDATE seller_accounts SET password_hash=?,secret_encrypted=?,last_counter=?,invite_hash=NULL,invite_expires=NULL,version=version+1 WHERE id=?').run(salt+':'+scryptSync(password,salt,64).toString('hex'),seal(secret),counter,row.id);
 await salesEvent({id:String(row.id),name:'Seller',role:'seller'},'seller.enrolled',String(row.id));return {ok:true};
});}
export async function sellerLogin(email:string,password:string,code:string){requireSalesEnabled();return transaction(async()=>{
 const row=await db().prepare('SELECT * FROM seller_accounts WHERE email=? AND active=1').get(email.toLowerCase().trim());
 if(!row?.password_hash||!row.secret_encrypted||!passwordMatches(password,String(row.password_hash)))throw new HttpError(401,'Onjuist e-mailadres, wachtwoord of authenticatorcode.');
 const counter=counterFor(unseal<string>(String(row.secret_encrypted)),code,Number(row.last_counter));if(counter===null)throw new HttpError(401,'Onjuist e-mailadres, wachtwoord of authenticatorcode.');
 await db().prepare('UPDATE seller_accounts SET last_counter=? WHERE id=?').run(counter,row.id);await db().prepare('DELETE FROM seller_sessions WHERE expires_at<?').run(new Date().toISOString());
 const value=token();await db().prepare('INSERT INTO seller_sessions(hash,seller_id,account_version,expires_at) VALUES(?,?,?,?)').run(hash('seller:'+value),row.id,row.version,new Date(Date.now()+2*3600000).toISOString());
 await salesEvent({id:String(row.id),name:String(row.name),role:'seller'},'seller.login',String(row.id));return sessionCookie('bigk_seller',value,7200);
});}
