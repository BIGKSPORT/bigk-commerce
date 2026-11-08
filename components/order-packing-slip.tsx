import {headers} from 'next/headers';
import {notFound,redirect} from 'next/navigation';
import {HttpError,requireAdmin} from '@/lib/security';
import {requireOperator} from '@/lib/staff-access';
import {getOrder} from '@/lib/commerce';
import {products} from '@/lib/db';
import {seller} from '@/lib/seller';
import {shopFeatures} from '@/lib/shop-features';
import PrintButton from '@/components/print-button';
export default async function OrderPackingSlip({params,staff=false}:{params:Promise<{id:string}>;staff?:boolean}){
 const req=new Request('https://internal.invalid',{headers:await headers()});
 try{if(staff)await requireOperator(req,'warehouse_manager');else await requireAdmin(req);}catch(e){if(e instanceof HttpError&&e.status===401)redirect(staff?'/staff':'/admin');throw e;}
 const order=await getOrder((await params).id);if(!order||!['paid','fulfilled'].includes(order.status))notFound();
 const catalog=await products();let photos=false;
 try{photos=(await shopFeatures()).photo_packing_slips;}catch{ /* Older schemas keep their original printable document. */ }
 return <main className="packing-slip page-container"><PrintButton/><h1>BIG K · Packing slip</h1><p>Order #{order.id.slice(0,8).toUpperCase()} · {new Date(order.createdAt).toLocaleDateString('en-GB',{timeZone:'Europe/Brussels'})}</p><address>{order.deliveryAddress.name}<br/>{order.deliveryAddress.address}<br/>{order.deliveryAddress.postal} {order.deliveryAddress.city}<br/>{order.deliveryAddress.country}</address><p>{order.email} · {order.phone}</p><table><thead><tr><th>Check</th>{photos&&<th>Photo</th>}<th>Item</th><th>SKU / article</th><th>Size</th><th>Qty</th></tr></thead><tbody>{order.items.map((line,i)=>{const p=catalog.find(p=>p.variants.some(v=>v.id===line.variantId)),identifier=line.variantId?p?.content?.trade?.identifiers?.[line.variantId]:undefined,image=identifier?.images?.[0]||p?.images[0];return <tr key={i}><td>☐</td>{photos&&<td>{image?<img src={image} alt={line.name} width={72} height={90} style={{objectFit:'contain'}}/>:'—'}</td>}<td>{line.name}</td><td>{identifier?.sku||p?.code||line.variantId||'—'}</td><td>{line.size}</td><td>{line.quantity}</td></tr>;})}</tbody></table><p>Packed by: ____________________ Date: ____________________</p><p>Check every size and quantity before dispatch. This is a packing slip, not a tax invoice.</p><footer>{seller.name} · {seller.address}, {seller.postal} {seller.city}</footer></main>;
}
