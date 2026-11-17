import {transaction} from './db';
import {b2bDb as db} from './b2b-db';
import {cookieValue,hash,HttpError,sessionCookie,token} from './security';
import {emailDeliveryAllowed} from './email-policy';
export function requireB2BEnabled(){if(process.env.B2B_PORTAL_ENABLED!=='true')throw new HttpError(404,'Het B2B-portaal is nog niet ingeschakeld.');}
export async function b2bEvent(actorId:string,action:string,entity:string){await db().prepare('INSERT INTO b2b_events(id,actor_id,action,entity,created_at) VALUES(?,?,?,?,?)').run(crypto.randomUUID(),actorId,action,entity,new Date().toISOString());}
export async function b2bActor(req:Request){
 requireB2BEnabled();const value=cookieValue(req,'bigk_b2b');if(!value)throw new HttpError(401,'Log in met je goedgekeurde B2B-account.');
 const row=await db().prepare('SELECT a.id FROM b2b_sessions s JOIN b2b_accounts a ON a.id=s.account_id WHERE s.hash=? AND s.expires_at>? AND a.active=1 AND a.version=s.account_version').get(hash('b2b-session:'+value),new Date().toISOString());
 if(!row)throw new HttpError(401,'Je B2B-sessie is verlopen of ingetrokken.');return String(row.id);
}
export async function b2bInvitation(accountId:string,actorId='owner',minutes=30){return transaction(async()=>{
 const row=await db().prepare('SELECT id,version FROM b2b_accounts WHERE id=? AND active=1').get(accountId);if(!row)throw new HttpError(404,'Actief B2B-account niet gevonden.');
 await db().prepare('DELETE FROM b2b_links WHERE account_id=? OR expires_at<?').run(accountId,new Date().toISOString());
 const value=token();await db().prepare('INSERT INTO b2b_links(hash,account_id,account_version,expires_at) VALUES(?,?,?,?)').run(hash('b2b-link:'+value),accountId,row.version,new Date(Date.now()+minutes*60000).toISOString());
 await b2bEvent(actorId,'login.link_created',accountId);return {setupPath:'/b2b#'+value};
});}
export async function consumeB2BLink(value:string){requireB2BEnabled();if(!/^[A-Za-z0-9_-]{40,100}$/.test(value))throw new HttpError(400,'Ongeldige aanmeldlink.');return transaction(async()=>{
 const row=await db().prepare('SELECT a.id,a.version FROM b2b_links l JOIN b2b_accounts a ON a.id=l.account_id WHERE l.hash=? AND l.expires_at>? AND a.active=1 AND l.account_version=a.version').get(hash('b2b-link:'+value),new Date().toISOString());
 if(!row)throw new HttpError(410,'Deze aanmeldlink is verlopen of gebruikt. Vraag een nieuwe link.');
 await db().prepare('DELETE FROM b2b_links WHERE account_id=?').run(row.id);await db().prepare('DELETE FROM b2b_sessions WHERE expires_at<?').run(new Date().toISOString());
 const session=token();await db().prepare('INSERT INTO b2b_sessions(hash,account_id,account_version,expires_at) VALUES(?,?,?,?)').run(hash('b2b-session:'+session),row.id,row.version,new Date(Date.now()+7*24*3600000).toISOString());
 await b2bEvent(String(row.id),'login.completed',String(row.id));return sessionCookie('bigk_b2b',session,7*24*3600);
});}
export async function requestB2BLink(email:string){
 requireB2BEnabled();if(!process.env.RESEND_API_KEY||!process.env.EMAIL_FROM||!process.env.APP_URL)throw new HttpError(503,'De aanmeldmail is nog niet geconfigureerd. Vraag BIG K om een persoonlijke aanmeldlink.');
 const account=await db().prepare('SELECT id FROM b2b_accounts WHERE email=? AND active=1').get(email.toLowerCase().trim());
 if(!account)return {ok:true};
 if(!emailDeliveryAllowed(email))return {ok:true};
 const link=await b2bInvitation(String(account.id),String(account.id),15),url=new URL(link.setupPath,process.env.APP_URL);
 const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+process.env.RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({from:process.env.EMAIL_FROM,to:email,subject:'Je BIG K B2B-aanmeldlink',text:'Meld je aan bij je BIG K B2B-account:\n\n'+url.toString()+'\n\nDeze persoonlijke link is 15 minuten geldig en werkt één keer. Heb je deze niet aangevraagd, negeer dan deze e-mail.'}),signal:AbortSignal.timeout(10000)}).catch(()=>null);
 if(!response?.ok){await db().prepare('DELETE FROM b2b_links WHERE hash=?').run(hash('b2b-link:'+link.setupPath.split('#')[1]));throw new HttpError(502,'Aanmeldmail kon niet worden verzonden. Vraag BIG K om een nieuwe link.');}
 return {ok:true};
}
