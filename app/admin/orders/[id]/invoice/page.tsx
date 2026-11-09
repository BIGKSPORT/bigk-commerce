import {headers} from 'next/headers';
import {notFound,redirect} from 'next/navigation';
import {HttpError,requireAdmin} from '@/lib/security';
import {savedInvoice} from '@/lib/order-invoices';
import {money} from '@/lib/format';
import PrintButton from '@/components/print-button';
export const dynamic='force-dynamic';
export const metadata={title:'Private invoice',robots:{index:false,follow:false}};
export default async function InvoicePage({params}:{params:Promise<{id:string}>}){
 try{await requireAdmin(new Request('https://internal.invalid',{headers:await headers()}));}catch(e){if(e instanceof HttpError&&e.status===401)redirect('/admin');throw e;}
 const invoice=await savedInvoice((await params).id);if(!invoice)notFound();const date=(value:string)=>new Date(value).toLocaleDateString('en-GB',{timeZone:'Europe/Brussels'});
 return <main id="main" className="packing-slip page-container"><PrintButton label="Print invoice / save PDF"/>{invoice.test&&<p><strong>TEST DOCUMENT — NOT A PRODUCTION INVOICE</strong></p>}<h1>Invoice {invoice.number}</h1><p>Issued {date(invoice.issuedAt)} · Order #{invoice.orderId.slice(0,8).toUpperCase()} · Order date {date(invoice.orderDate)}</p><section><h2>{invoice.seller.name}</h2><address>{invoice.seller.address}<br/>{invoice.seller.postal} {invoice.seller.city}<br/>{invoice.seller.country}</address><p>VAT {invoice.seller.vat}</p></section><section><h2>Bill to</h2><address>{invoice.buyer.name}<br/>{invoice.buyer.address}<br/>{invoice.buyer.postal} {invoice.buyer.city}<br/>{invoice.buyer.country}</address><p>{invoice.buyer.email}</p></section><table><thead><tr><th>Description</th><th>Quantity</th><th>VAT included</th><th>Total incl. VAT</th></tr></thead><tbody>{invoice.lines.map((line,i)=><tr key={i}><td>{line.description}</td><td>{line.quantity}</td><td>{money(line.tax)}</td><td>{money(line.gross)}</td></tr>)}<tr><td>Delivery</td><td>1</td><td>{money(invoice.shippingTax)}</td><td>{money(invoice.shipping)}</td></tr></tbody></table><table><thead><tr><th>VAT rate</th><th>Taxable amount</th><th>VAT amount</th></tr></thead><tbody>{invoice.taxes.map((tax,i)=><tr key={i}><td>{tax.percentage}% {tax.country}</td><td>{money(tax.taxableAmount)}</td><td>{money(tax.amount)}</td></tr>)}</tbody></table><p>Excluding VAT: {money(invoice.net)}<br/>VAT: {money(invoice.tax)}<br/><strong>Total paid: {money(invoice.total)}</strong><br/>Amount due: {money(0)}</p><p>Paid through Stripe. Product amounts reflect discounts applied at checkout.</p></main>;
}
