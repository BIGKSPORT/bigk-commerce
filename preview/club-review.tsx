import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ClubDashboard,type ClubView} from '../components/club-dashboard';
import {SimpleHeader} from '../components/simple-header';
import {Footer} from '../components/brand';
import {ClubRulesContent as ClubRules} from '../components/club-rules-content';
import type {ClubEventCard} from '../lib/club-events';
const names=['Zero points','Pending points','Reward ready','Expiring soon','Event states'];
const now=new Date(),future=(days:number)=>new Date(now.getTime()+days*86400000).toISOString();
function App(){const [scenario,setScenario]=useState(2),[rules,setRules]=useState(false),[bookings,setBookings]=useState<Record<string,string>>({});const available=scenario===0||scenario===1?0:scenario===2?240:180;const club:ClubView={member:true,enabled:true,name:'Alex',available,pending:scenario===1?120:scenario===0?0:79,nextExpiry:scenario>=3?future(10):null,waitDays:30,lots:scenario>=3?[{id:'demo-lot',remaining:180,expiresAt:future(10)}]:[],history:scenario===0?[]:[{id:'1',reason:scenario===1?'purchase_pending':'purchase_available',points:scenario===1?120:240,created_at:now.toISOString(),order_id:'DEMO-001'},{id:'2',reason:'joined',points:0,created_at:now.toISOString(),order_id:null}]};
 const base={description:'Fictional review event — no real registration or tickets.',audience:'members' as const,memberOpensAt:future(2),publicOpensAt:future(5),startsAt:future(20),location:'Demo location, Belgium',capacity:20,maxTickets:2,priceCents:0,published:true,bookingQuantity:0,remaining:10};
 const states:ClubEventCard['status'][]=['opens_later','members_early','register','registered','full','waitlisted','ended','paid_unavailable'];
 const events=scenario===4?states.map((status,i)=>({...base,id:'demo-'+i,title:'Demo event '+(i+1),status:(bookings['demo-'+i]||status) as ClubEventCard['status'],bookingQuantity:['registered','waitlisted'].includes(bookings['demo-'+i]||status)?1:0,remaining:status==='full'?0:10,priceCents:status==='paid_unavailable'?1200:0})):[];
 return <><div className="review-toolbar"><strong>LOCAL DESIGN REVIEW · FICTIONAL MEMBER & EVENTS · NO EMAILS OR PAYMENTS</strong><label>Dashboard scenario <select value={scenario} onChange={e=>{setScenario(Number(e.target.value));setRules(false)}}>{names.map((n,i)=><option key={n} value={i}>{n}</option>)}</select></label><button onClick={()=>setRules(!rules)}>{rules?'Back to dashboard':'Read programme rules'}</button></div>{rules?<ClubRules/>:<><SimpleHeader/><ClubDashboard review club={club} events={events} onBook={async(id,_quantity,action)=>{setBookings({...bookings,[id]:action==='cancel'?'register':action==='waitlist'?'waitlisted':'registered'})}}/><Footer/></>}</>
}
createRoot(document.getElementById('root')!).render(<App/>);
