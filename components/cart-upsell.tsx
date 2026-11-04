'use client';
import {useEffect,useState} from 'react';
import {useSiteLanguage} from './site-language';
import {localizedMoney,type Locale} from '@/lib/i18n/config';
import {cartOffer,type CartOffer} from '@/lib/cart-upsell';
import type {Product,CartLine} from '@/lib/types';
import styles from './cart-upsell.module.css';
const copy:Record<Locale,{title:string;pair:string;delivery:string;size:string;add:string;added:string;error:string}>={
 en:{title:'Complete your selection',pair:'A useful addition to your selection.',delivery:'With this item, your bag qualifies for free delivery.',size:'Choose a size',add:'Add to bag',added:'Added to your bag. Your total has been updated.',error:'This item could not be added. Please check its availability.'},
 nl:{title:'Maak je selectie compleet',pair:'Een passende aanvulling op je selectie.',delivery:'Met dit artikel komt je winkelmand in aanmerking voor gratis levering.',size:'Kies een maat',add:'In winkelmand',added:'Toegevoegd aan je winkelmand. Je totaal is bijgewerkt.',error:'Dit artikel kon niet worden toegevoegd. Controleer de beschikbaarheid.'},
 fr:{title:'Complétez votre sélection',pair:'Un complément pour votre sélection.',delivery:'Avec cet article, votre panier bénéficie de la livraison gratuite.',size:'Choisissez une taille',add:'Ajouter au panier',added:'Ajouté à votre panier. Votre total a été mis à jour.',error:'Cet article n’a pas pu être ajouté. Vérifiez sa disponibilité.'},
 de:{title:'Ergänzen Sie Ihre Auswahl',pair:'Eine passende Ergänzung zu Ihrer Auswahl.',delivery:'Mit diesem Artikel ist die Lieferung Ihres Warenkorbs kostenlos.',size:'Größe wählen',add:'In den Warenkorb',added:'Zum Warenkorb hinzugefügt. Der Gesamtbetrag wurde aktualisiert.',error:'Dieser Artikel konnte nicht hinzugefügt werden. Bitte prüfen Sie die Verfügbarkeit.'}
};
export default function CartUpsell({bag,onAdd,onCatalog}:{bag:CartLine[];onAdd:(line:CartLine,product:Product)=>boolean;onCatalog?:(catalog:Product[])=>void}){
 const {locale}=useSiteLanguage(),[catalog,setCatalog]=useState<Product[]>([]),[ready,setReady]=useState(false),[accepted,setAccepted]=useState(false);
 useEffect(()=>{const abort=new AbortController();fetch('/api/catalog',{cache:'no-store',signal:abort.signal}).then(r=>{if(!r.ok)throw Error('Unavailable');return r.json()}).then(data=>{if(data.mode==='live'&&data.ready&&Array.isArray(data.products)){setCatalog(data.products);setReady(true);onCatalog?.(data.products)}}).catch(()=>{});return()=>abort.abort()},[onCatalog]);
 const c=copy[locale];if(accepted)return <p className={styles.notice} role="status">{c.added}</p>;
 const offer=ready?cartOffer(catalog,bag):null;if(!offer)return null;
 return <Offer key={offer.product.id} offer={offer} locale={locale} onAdd={onAdd} onAccepted={()=>setAccepted(true)}/>;
}
function Offer({offer,locale,onAdd,onAccepted}:{offer:CartOffer;locale:Locale;onAdd:(line:CartLine,product:Product)=>boolean;onAccepted:()=>void}){
 const c=copy[locale],p=offer.product,[variantId,setVariantId]=useState(offer.variants.length===1?offer.variants[0].id:''),[error,setError]=useState('');
 const selected=offer.variants.find(v=>v.id===variantId);const money=(n:number)=>localizedMoney(n,locale);
 function add(){if(!selected)return;if(onAdd({variantId:selected.id,quantity:1},p)){onAccepted()}else setError(c.error)}
 return <section className={styles.card} aria-label={c.title} data-cart-upsell><img src={p.images[0]} alt={p.name} width="72" height="96" loading="lazy"/><div><span className={styles.eyebrow}>{c.title}</span><h3>{p.name}</h3><strong>{money(p.priceCents!)}</strong><p>{offer.reason==='free_delivery'?c.delivery:c.pair}</p></div><div className={styles.actions}><label><span className="sr-only">{c.size}</span><select aria-label={c.size} value={variantId} onChange={event=>setVariantId(event.target.value)}><option value="">{c.size}</option>{offer.variants.map(v=><option key={v.id} value={v.id}>{p.content?.trade?.identifiers?.[v.id]?.colour? p.content.trade.identifiers[v.id].colour+' · ':''}{v.size}</option>)}</select></label><button className="button outline" type="button" disabled={!selected} onClick={add}>{c.add} · {money(p.priceCents!)}</button></div>{error&&<p role="alert">{error}</p>}</section>
}
