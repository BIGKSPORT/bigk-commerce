import {salesDb} from './sales-db';
import {emailDeliveryAllowed} from './email-policy';

type ReminderRow={id:string;due_at:string;note:string;company_name:string};
function localParts(now:Date){
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Brussels',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now);
 const get=(name:string)=>parts.find(p=>p.type===name)?.value||'';
 return {day:get('year')+'-'+get('month')+'-'+get('day'),hour:Number(get('hour')),minute:Number(get('minute'))};
}
function escapeHtml(value:string){return value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'} as Record<string,string>)[c]);}
export async function sendSalesFollowupReminders(now=new Date()){
 if(process.env.SELLER_PORTAL_ENABLED!=='true')return {sent:0,failed:0,skipped:0};
 const {day,hour,minute}=localParts(now);
 if(hour!==8||minute>=10)return {sent:0,failed:0,skipped:0};
 const key=process.env.RESEND_API_KEY,from=process.env.EMAIL_FROM,origin=process.env.APP_URL;
 if(!key||!from||!origin?.startsWith('https://'))return {sent:0,failed:0,skipped:1};
 const cutoff=new Date(now.getTime()+16*60*60*1000).toISOString();
 const sellers=await salesDb().prepare("SELECT id,name,email FROM seller_accounts WHERE active=1 AND email<>'' ORDER BY id").all() as {id:string;name:string;email:string}[];
 let sent=0,failed=0,skipped=0;
 for(const seller of sellers){
  if(!emailDeliveryAllowed(seller.email)){skipped++;continue;}
  const rows=await salesDb().prepare("SELECT f.id,f.due_at,f.note,COALESCE(p.company_name,b.name,'Klantcontact') AS company_name FROM seller_followups f LEFT JOIN seller_prospects p ON p.id=f.prospect_id LEFT JOIN b2b_accounts b ON b.id=f.account_id WHERE f.seller_id=? AND f.completed_at IS NULL AND f.due_at<=? ORDER BY f.due_at ASC LIMIT 100").all(seller.id,cutoff) as ReminderRow[];
  if(!rows.length)continue;
  const eventId='followup-reminder:'+seller.id+':'+day;
  const claim=await salesDb().prepare("INSERT INTO seller_events(id,actor_id,action,entity,created_at) VALUES(?,?,?,?,?) ON CONFLICT(id) DO NOTHING").run(eventId,seller.id,'followup.reminder_sent',day,now.toISOString());
  if(claim.changes!==1){skipped++;continue;}
  const list=rows.map(r=>'- '+r.company_name+' · '+new Date(r.due_at).toLocaleString('nl-BE',{timeZone:'Europe/Brussels'})+' · '+r.note);
  const textBody='Hallo '+seller.name+',\n\nDit zijn je openstaande BIG K Sales-opvolgingen voor vandaag en eerder:\n\n'+list.join('\n')+'\n\nOpen je Sales cockpit om opvolgingen af te ronden of nieuwe contactmomenten te plannen: '+new URL('/staff/sales',origin).toString()+'\n\nBIG K';
  const items=rows.map(r=>'<li><strong>'+escapeHtml(r.company_name)+'</strong> · '+escapeHtml(new Date(r.due_at).toLocaleString('nl-BE',{timeZone:'Europe/Brussels'}))+'<br/>'+escapeHtml(r.note)+'</li>').join('');
  try{
   const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json','Idempotency-Key':'bigk-sales-followups-'+seller.id+'-'+day},body:JSON.stringify({from,to:seller.email,subject:'BIG K Sales · je opvolgingen voor vandaag',text:textBody,html:'<p>Hallo '+escapeHtml(seller.name)+',</p><p>Dit zijn je openstaande BIG K Sales-opvolgingen voor vandaag en eerder:</p><ul>'+items+'</ul><p><a href="'+escapeHtml(new URL('/staff/sales',origin).toString())+'">Open je Sales cockpit</a></p><p>BIG K</p>'}),signal:AbortSignal.timeout(10000)});
   if(!response.ok)throw new Error('Email provider rejected reminder');
   sent++;
  }catch{
   await salesDb().prepare('DELETE FROM seller_events WHERE id=?').run(eventId);
   failed++;
  }
 }
 return {sent,failed,skipped};
}
