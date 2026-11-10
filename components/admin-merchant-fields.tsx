'use client';
import type {ProductContent} from '@/lib/types';
export default function AdminMerchantFields({content,setContent}:{content:ProductContent;setContent:(next:ProductContent)=>void}){
 return <section><h3>Product-feed attributes</h3><p>Confirm these from the actual product. Blank values remain unconfirmed. Shared values apply to the style unless a colour has its own saved value.</p><div className="bo-data-grid">
 <label className="field">Intended gender<select aria-label="Product-feed gender" value={content.trade?.gender||''} onChange={event=>setContent({...content,trade:{...content.trade,gender:(event.target.value||undefined) as NonNullable<ProductContent['trade']>['gender']}})}><option value="">Not confirmed</option><option value="male">Male</option><option value="female">Female</option><option value="unisex">Unisex</option></select></label>
 <label className="field">Age group<select aria-label="Product-feed age group" value={content.trade?.ageGroup||''} onChange={event=>setContent({...content,trade:{...content.trade,ageGroup:(event.target.value||undefined) as NonNullable<ProductContent['trade']>['ageGroup']}})}><option value="">Not confirmed</option>{['newborn','infant','toddler','kids','adult'].map(value=><option key={value}>{value}</option>)}</select></label>
 <label className="field">Condition<select aria-label="Product-feed condition" value={content.trade?.condition||''} onChange={event=>setContent({...content,trade:{...content.trade,condition:(event.target.value||undefined) as NonNullable<ProductContent['trade']>['condition']}})}><option value="">Not confirmed</option>{['new','used','refurbished'].map(value=><option key={value}>{value}</option>)}</select></label>
 </div></section>;
}
