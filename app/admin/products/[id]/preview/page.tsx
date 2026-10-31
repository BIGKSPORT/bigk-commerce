import {headers} from 'next/headers';
import {notFound,redirect} from 'next/navigation';
import {requireAdmin,HttpError} from '@/lib/security';
import {products} from '@/lib/db';
import Storefront from '@/components/storefront';
export const dynamic='force-dynamic';
export const metadata={title:'Private product preview',robots:{index:false,follow:false}};
export default async function AdminProductPreview({params}:{params:Promise<{id:string}>}){
 try{await requireAdmin(new Request('https://internal.invalid',{headers:await headers()}))}catch(e){if(e instanceof HttpError&&e.status===401)redirect('/admin');throw e}
 const {id}=await params,p=(await products()).find(p=>p.id===id);if(!p)notFound();
 const preview={...p,active:false,approved:false,variants:p.variants.filter(v=>!p.content?.trade?.identifiers?.[v.id]?.archived).map(v=>({...v,stock:Math.max(0,v.stock-v.reserved),reserved:0,reported:null}))};
 return <><div className="info-message" role="status">PRIVATE PRODUCT PREVIEW · Saved data · Purchasing disabled · <a href="/admin">Back to backoffice</a></div><Storefront products={[preview]} mode="live" ready={false} initialProduct={p.id}/></>;
}
