'use client';
import {useEffect,useState} from 'react';
import {UserRound,ArrowRight} from 'lucide-react';
import {useSiteLanguage} from './site-language';
type SavedDetails=Partial<Record<'firstName'|'lastName'|'email'|'phone'|'country'|'address'|'postal'|'city',string>>;
/** Customer data stays in memory and is only applied after an explicit click. */
export default function CheckoutSavedDetails({apply}:{apply:(details:SavedDetails)=>number}){
 const {t}=useSiteLanguage();
 const [saved,setSaved]=useState<SavedDetails|null>(null),[notice,setNotice]=useState('');
 useEffect(()=>{const controller=new AbortController();fetch('/api/account/profile',{cache:'no-store',signal:controller.signal}).then(async r=>{if(!r.ok)return;const d=await r.json(),p=d.profile;if(!p||typeof d.email!=='string')return;const pick=(v:unknown)=>typeof v==='string'?v:'';if(!controller.signal.aborted)setSaved({email:pick(d.email),firstName:pick(p.firstName),lastName:pick(p.lastName),phone:pick(p.phone),country:['BE','NL','FR','DE','LU'].includes(p.country)?p.country:'',address:pick(p.shippingAddress),postal:pick(p.postal),city:pick(p.city)})}).catch(()=>{});return()=>controller.abort()},[]);
 if(!saved)return null;
 return <div className="checkout-saved"><div><UserRound size={20}/><span><strong>{t('Welcome back.')}</strong><small>{t('Use your saved BIG K details to fill empty fields.')}</small></span></div><button type="button" onClick={()=>{const count=apply(saved);setNotice(count?'Saved details filled in. Check your address before continuing.':'Your existing entries were kept.')}}>{t('Use saved details')} <ArrowRight size={14}/></button>{notice&&<p role="status">{t(notice)}</p>}</div>;
}
