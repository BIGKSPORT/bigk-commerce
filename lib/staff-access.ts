import {createHmac,randomBytes,scryptSync} from 'node:crypto';
import QRCode from 'qrcode';
import {z} from 'zod';
import {db,transaction} from './db';
import {base32,counterFor,seal,unseal} from './admin-mfa';
import {cookieValue,hash,HttpError,passwordMatches,requireAdmin,sessionCookie,token} from './security';
import {requireFeature} from './shop-features';
import {operationAudit,ownerActor,type OperationActor} from './operations-audit';
export const staffRole=z.enum(['stock_manager','warehouse_manager']);
export const inviteSchema=z.object({name:z.string().trim().min(2).max(80),email:z.email().max(254),role:staffRole}).strict();
export async function staffList(){return db().prepare('SELECT id,name,email,role,active,version,created_at FROM staff_accounts ORDER BY name').all();}
export async function inviteStaff(input:z.infer<typeof inviteSchema>){await requireFeature('staff_portal');return transaction(async()=>{
 const email=input.email.toLowerCase();if(await db().prepare('SELECT id FROM staff_accounts WHERE email=?').get(email))throw new HttpError(409,'This staff email already exists. Disable or reset the existing account.');
 const id=crypto.randomUUID(),value=token(),now=new Date().toISOString();
 await db().prepare('INSERT INTO staff_accounts(id,name,email,role,invite_hash,invite_expires,created_at) VALUES(?,?,?,?,?,?,?)').run(id,input.name,email,input.role,hash('staff-invite:'+value),new Date(Date.now()+30*60000).toISOString(),now);
 await operationAudit(ownerActor,'staff.invited',id,{email,role:input.role});return {id,setupPath:'/staff/setup#'+value};
});}
async function invited(value:string){if(!/^[A-Za-z0-9_-]{40,100}$/.test(value))throw new HttpError(400,'Invalid setup link.');const row=await db().prepare('SELECT id,email FROM staff_accounts WHERE invite_hash=? AND invite_expires>? AND active=1').get(hash('staff-invite:'+value),new Date().toISOString());if(!row)throw new HttpError(410,'This setup link expired or was used. Ask the owner for a reset.');return row;}
export async function beginStaffSetup(value:string){await requireFeature('staff_portal');const row=await invited(value);const secret=base32(createHmac('sha256',unsealKey()).update('staff-setup:'+value).digest().subarray(0,20));return {secret,qr:await QRCode.toDataURL('otpauth://totp/'+encodeURIComponent('BIGK Staff:'+String(row.email))+'?secret='+secret+'&issuer=BIGK%20Staff&algorithm=SHA1&digits=6&period=30',{width:260,margin:2})};}
function unsealKey(){// Reuse the existing MFA encryption key; never send it to the browser.
 const key=process.env.ADMIN_MFA_KEY||'';if(!/^[a-f0-9]{64}$/.test(key))throw new HttpError(503,'Admin security is not configured.');return Buffer.from(key,'hex');
}
export async function finishStaffSetup(value:string,password:string,code:string){await requireFeature('staff_portal');if(password.length<16||password.length>256)throw new HttpError(400,'Use a password of 16–256 characters.');return transaction(async()=>{
 const row=await invited(value),secret=base32(createHmac('sha256',unsealKey()).update('staff-setup:'+value).digest().subarray(0,20)),counter=counterFor(secret,code);
 if(counter===null)throw new HttpError(400,'Use a fresh authenticator code.');const salt=randomBytes(16).toString('hex');
 await db().prepare('UPDATE staff_accounts SET password_hash=?,secret_encrypted=?,last_counter=?,invite_hash=NULL,invite_expires=NULL,version=version+1 WHERE id=?').run(salt+':'+scryptSync(password,salt,64).toString('hex'),seal(secret),counter,row.id);
 await operationAudit(ownerActor,'staff.enrolled',String(row.id),{method:'password_and_authenticator'});return {ok:true};
});}
export async function staffLogin(email:string,password:string,code:string){await requireFeature('staff_portal');return transaction(async()=>{
 const row=await db().prepare('SELECT * FROM staff_accounts WHERE email=? AND active=1').get(email.toLowerCase().trim());
 if(!row?.password_hash||!row.secret_encrypted||!passwordMatches(password,String(row.password_hash)))throw new HttpError(401,'Incorrect email, password or authenticator code.');
 const counter=counterFor(unseal<string>(String(row.secret_encrypted)),code,Number(row.last_counter));if(counter===null)throw new HttpError(401,'Incorrect email, password or authenticator code.');
 await db().prepare('UPDATE staff_accounts SET last_counter=? WHERE id=?').run(counter,row.id);
 const value=token();await db().prepare('DELETE FROM staff_sessions WHERE expires_at<?').run(new Date().toISOString());await db().prepare('INSERT INTO staff_sessions(hash,staff_id,account_version,expires_at) VALUES(?,?,?,?)').run(hash('staff:'+value),row.id,row.version,new Date(Date.now()+2*3600000).toISOString());
 await operationAudit({id:String(row.id),name:String(row.name),role:staffRole.parse(row.role)},'staff.login',String(row.id),{});return sessionCookie('bigk_staff',value,7200);
});}
export async function requireStaff(req:Request,role?:'stock_manager'|'warehouse_manager'):Promise<OperationActor>{await requireFeature('staff_portal');const value=cookieValue(req,'bigk_staff');if(!value)throw new HttpError(401,'Staff sign-in required.');const row=await db().prepare('SELECT a.id,a.name,a.role FROM staff_sessions s JOIN staff_accounts a ON a.id=s.staff_id WHERE s.hash=? AND s.expires_at>? AND a.active=1 AND a.version=s.account_version').get(hash('staff:'+value),new Date().toISOString());if(!row)throw new HttpError(401,'Staff sign-in required.');if(role&&row.role!==role)throw new HttpError(403,'This action is not permitted for your role.');return {id:String(row.id),name:String(row.name),role:staffRole.parse(row.role)};}
export async function requireOperator(req:Request,role:'stock_manager'|'warehouse_manager'){try{await requireAdmin(req);return ownerActor;}catch(e){if(!(e instanceof HttpError)||e.status!==401)throw e;}return requireStaff(req,role);}
export async function changeStaff(id:string,action:'disable'|'reset'){return transaction(async()=>{
 const row=await db().prepare('SELECT id FROM staff_accounts WHERE id=?').get(id);if(!row)throw new HttpError(404,'Staff account not found.');
 const value=action==='reset'?token():null;
 await db().prepare('UPDATE staff_accounts SET active=?,version=version+1,invite_hash=?,invite_expires=? WHERE id=?').run(action==='disable'?0:1,value?hash('staff-invite:'+value):null,value?new Date(Date.now()+30*60000).toISOString():null,id);
 // A reset revokes previous credentials as well as all existing sessions.
 if(action==='reset')await db().prepare('UPDATE staff_accounts SET password_hash=NULL,secret_encrypted=NULL,last_counter=-1 WHERE id=?').run(id);
 await db().prepare('DELETE FROM staff_sessions WHERE staff_id=?').run(id);await operationAudit(ownerActor,'staff.'+action,id,{});return value?{setupPath:'/staff/setup#'+value}:{ok:true};
});}
