'use client';
import {shippingCharge,freeShippingThreshold,isCheckoutCountry,checkoutCountries,checkoutCountryNames} from '@/lib/shipping-policy';
import {bagMedia} from '@/lib/bag-presentation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, LockKeyhole, Truck, Check } from 'lucide-react';
import Link from '@/components/site-link';
import {useSiteLanguage} from '@/components/site-language';
import type { CartLine, Product } from '@/lib/types';
import CheckoutSavedDetails from '@/components/checkout-saved-details';
import {ClubEstimate} from '@/components/club-estimate';
import {productKind} from '@/lib/club-rules';
import {checkoutAttemptKey} from '@/lib/checkout-attempt';
import {localizedMoney} from '@/lib/i18n/config';
import { SimpleHeader } from '@/components/simple-header';
import { Footer } from '@/components/brand';
import PaymentMethods from '@/components/payment-methods';

export default function Checkout(){
  const {t,path,locale}=useSiteLanguage();
  const money=(cents:number)=>localizedMoney(cents,locale);
  const [products,setProducts]=useState<Product[]>([]);
  const [bag,setBag]=useState<CartLine[]>([]);
  const [mode,setMode]=useState('demo');
  const [paymentEnvironment,setPaymentEnvironment]=useState('');
  const [ready,setReady]=useState(false);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [clubPoints,setClubPoints]=useState(0);
  const [promoCode,setPromoCode]=useState('');
  const [country,setCountry]=useState('BE');
  const formRef=useRef<HTMLFormElement>(null);
  const key=useRef('');
  const payload=useRef('');

  useEffect(()=>{
    try{const saved=sessionStorage.getItem('bigk-delivery-country');if(saved&&isCheckoutCountry(saved))setCountry(saved)}catch{}
    fetch('/api/catalog').then(r=>{if(!r.ok)throw Error('Unable to load the collection.');return r.json()}).then(d=>{
      setProducts(d.products);setMode(d.mode);setPaymentEnvironment(d.paymentEnvironment||'');setReady(d.ready);
      try{
        const raw=JSON.parse(localStorage.getItem('bigk-bag-v2')||'[]');
        if(Array.isArray(raw))setBag(raw.filter(x=>x&&Number.isInteger(x.quantity)&&x.quantity>0&&x.quantity<=5&&d.products.some((p:Product)=>p.variants.some(v=>v.id===x.variantId))));
      }catch{}
      setLoading(false);
    }).catch(e=>{setError(e.message);setLoading(false)});
  },[]);

  useEffect(()=>{
    const restore=()=>{
      try{
        const raw=JSON.parse(localStorage.getItem('bigk-bag-v2')||'[]');
        if(Array.isArray(raw))setBag(raw.filter(x=>x&&Number.isInteger(x.quantity)&&x.quantity>0&&x.quantity<=5&&products.some(p=>p.variants.some(v=>v.id===x.variantId))));
      }catch{}
    };
    window.addEventListener('bigk-cart-restored',restore);
    return()=>window.removeEventListener('bigk-cart-restored',restore);
  },[products]);

  const lines=bag.map(x=>({...x,p:products.find(p=>p.variants.some(v=>v.id===x.variantId))!})).filter(x=>x.p);
  const sub=lines.reduce((n,x)=>n+(x.p.priceCents||0)*x.quantity,0);
  const ship=shippingCharge(sub,country,lines.length===bag.length?lines.map(line=>line.p.id):[]),shippingThreshold=freeShippingThreshold(country);
  const clubDiscount=clubPoints>0?clubPoints*3:0;
  const estimatedTotal=Math.max(0,sub+ship-clubDiscount);

  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    if(busy)return;
    setBusy(true);setError('');
    const f=new FormData(e.currentTarget);
    const code=String(f.get('promoCode')||promoCode||'').trim().toUpperCase();
    if(code&&clubPoints){
      setError('Promo codes cannot be combined with Club points. Choose one discount.');
      setBusy(false);
      return;
    }
    const data={
      locale,
      items:bag,
      ...(clubPoints?{clubPoints}:{}),
      ...(code?{promoCode:code}:{}),
      email:f.get('email'),
      phone:f.get('phone'),
      firstName:f.get('firstName'),
      lastName:f.get('lastName'),
      country:f.get('country'),
      address:f.get('address'),
      postal:f.get('postal'),
      city:f.get('city'),
      consent:true as const,
    };
    const fingerprint=JSON.stringify(data);
    if(payload.current!==fingerprint){payload.current=fingerprint;key.current=crypto.randomUUID()}
    try{
      key.current=await checkoutAttemptKey(fingerprint,key.current);
      const r=await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,requestKey:key.current})});
      const d=await r.json();
      if(!r.ok)throw Error(d.error||'Checkout failed.');
      if(d.url){window.location.assign(d.url);return}
      localStorage.removeItem('bigk-bag-v2');
      window.location.assign(path('/order')+'#'+d.id+'.'+d.receiptToken);
    }catch(err){
      setError(err instanceof Error?err.message:'Please try again.');
      setBusy(false);
    }
  }

  function onPromoChange(value:string){
    const next=value.toUpperCase();
    setPromoCode(next);
    if(next.trim()&&clubPoints)setClubPoints(0);
  }

  function onRedeemPoints(points:number){
    setClubPoints(points);
    if(points>0&&promoCode.trim())setPromoCode('');
  }

  return <>
    <SimpleHeader/>
    <main id="main" className="page-container checkout-page">
      <div className="checkout-heading">
        <span className="eyebrow">{t("BIG K / CHECKOUT")}</span>
        <h1>{mode==='demo'?t('Your demo checkout.'):paymentEnvironment==='test'?t('Your test checkout.'):t('One step closer.')}</h1>
        <p className="page-intro">{mode==='demo'?t('Explore the complete order journey. Use fictional details; no payment will be taken.'):paymentEnvironment==='test'?t('Stripe test mode: use test payment details only. No real money will be charged.'):t('Your next move starts here. Complete your details, then pay securely with Stripe.')}</p>
      </div>
      <ol className="checkout-progress" aria-label={t("Checkout steps")}>
        <li><Check size={14}/> {t("Your bag")}</li>
        <li aria-current="step"><span>2</span> {t("Delivery details")}</li>
        <li><span>3</span> {t("Secure payment")}</li>
      </ol>
      {loading?<p role="status">{t("Loading your bag…")}</p>:!lines.length?
        <div className="panel"><p>{t("Your bag is empty.")}</p><Link href="/" className="button dark">{t("Explore products")} <ArrowRight size={16}/></Link></div>
      :
        <div className="page-grid checkout-grid">
          <form onSubmit={submit} className="checkout-form" ref={formRef}>
            <CheckoutSavedDetails apply={details=>{let filled=0;for(const [name,value] of Object.entries(details)){const field=formRef.current?.elements.namedItem(name);if(value&&(field instanceof HTMLInputElement||field instanceof HTMLSelectElement)&&(!field.value||(name==='country'&&!formRef.current?.dataset.countryEdited))){field.value=value;if(name==='country')setCountry(value);filled++}}return filled}}/>
            <section className="panel">
              <div className="checkout-section-title"><span>01</span><div><h2>{t("Your details")}</h2><p>{t("We’ll use these to keep you updated about your order.")}</p></div></div>
              <div className="field-row">
                <label className="field">{t("First name")}<input name="firstName" autoComplete="given-name" required maxLength={100}/></label>
                <label className="field">{t("Last name")}<input name="lastName" autoComplete="family-name" required maxLength={100}/></label>
              </div>
              <label className="field">{t("Email address")}<input name="email" type="email" autoComplete="email" required maxLength={254}/></label>
              <label className="field">{t("Mobile phone")}<input name="phone" type="tel" autoComplete="tel" required pattern="[+][1-9][0-9]{7,14}" placeholder="+32470123456" title={t("Use + followed by 8 to 15 digits, without spaces.")}/><span className="subtle-note">{t("International format, including country code.")}</span></label>
            </section>
            <section className="panel">
              <div className="checkout-section-title"><span>02</span><div><h2>{t("Delivery address")}</h2><p>{t("Where should we send your selection?")}</p></div></div>
              <label className="field">{t("Country")}<select name="country" value={country} onChange={e=>{setCountry(e.target.value);try{sessionStorage.setItem('bigk-delivery-country',e.target.value)}catch{}if(formRef.current)formRef.current.dataset.countryEdited='true'}} autoComplete="country" required>{checkoutCountries.map(code=><option key={code} value={code}>{t(checkoutCountryNames[code])}</option>)}</select></label>
              <label className="field">{t("Street and house number")}<input name="address" autoComplete="street-address" required minLength={3} maxLength={200}/></label>
              <div className="field-row">
                <label className="field">{t("Postal code")}<input name="postal" autoComplete="postal-code" required minLength={2} maxLength={20}/></label>
                <label className="field">{t("City")}<input name="city" autoComplete="address-level2" required maxLength={100}/></label>
              </div>
            </section>
            <section className="panel">
              <div className="checkout-section-title"><span>03</span><div><h2>{t('Promo code')}</h2><p>{t('Optional. Cannot be combined with Club points.')}</p></div></div>
              <label className="field">{t('Code')}<input name="promoCode" value={promoCode} onChange={e=>onPromoChange(e.target.value)} maxLength={32} autoComplete="off" placeholder="WELCOME10" style={{textTransform:'uppercase'}}/><span className="subtle-note">{t('Leave blank if you are not using a code.')}</span></label>
            </section>
            <section className="panel checkout-payment">
              <h2>{t("Ready for your next move?")}</h2>
              {mode==='live'&&paymentEnvironment==='live'&&<><PaymentMethods placement="checkout"/><p className="subtle-note">{t("If Stripe asks for a Link code, choose Pay without Link to continue.")}</p></>}
              {mode==='live'&&!ready&&<p className="info-message" role="status">{t("Checkout is being prepared. Payment is not available yet.")}</p>}
              <label className="check-field"><input name="consent" type="checkbox" required/><span>{mode==='demo'?t('I understand this is a demo order, I am using fictional information, and no payment or shipment will take place.'):<>{t("I agree to the")} <Link href="/info/terms">{t("terms")}</Link> {t("and have read the")} <Link href="/info/privacy">{t("privacy notice")}</Link>.</>}</span></label>
              {error&&<div className="error-message" role="alert">{t(error)}</div>}
              <button className="button dark full" disabled={busy||lines.some(x=>x.p.priceCents===null)||(mode==='live'&&!ready)} type="submit">{busy?t('Preparing your order…'):mode==='demo'?t('Create demo order'):paymentEnvironment==='test'?t('Continue to test payment'):t('Continue to secure payment')} <LockKeyhole size={16}/></button>
              <p className="subtle-note">{mode==='demo'?t('No card details are requested.'):t('Payment details are collected by Stripe on its hosted checkout page. Delivery details are confirmed there.')}</p>
              <div className="checkout-security"><LockKeyhole size={15}/><span>{mode==='demo'?t('No payment in demo mode'):t('Secure payment through Stripe')}</span></div>
            </section>
          </form>
          <aside className="checkout-summary">
            <section className="panel">
              <div className="checkout-summary-heading"><h2>{t("Your selection")}</h2><Link href="/">{t("Continue shopping")} <ArrowRight size={14}/></Link></div>
              {lines.map(x=><div className="order-line" key={x.variantId}><div className="checkout-product">{bagMedia(x.p,x.variantId).image&&<img src={bagMedia(x.p,x.variantId).image} alt={x.p.name} width="64" height="84"/>}<span>{x.p.name}<small>{x.p.content?.trade?.colour&&<>{x.p.content.trade.colour} · </>}{x.p.variants.find(v=>v.id===x.variantId)?.size} · {t('Qty')} {x.quantity}</small></span></div><strong>{x.p.priceCents===null?t('Price pending'):money(x.p.priceCents*x.quantity)}</strong></div>)}
              <div className="checkout-delivery-note"><Truck size={18}/><span>{shippingThreshold===null?t('Flat-rate standard delivery'):ship===0?t('Your order qualifies for free delivery.'):t('Free delivery from {amount}.').replace('{amount}',money(shippingThreshold))}</span></div>
              <ClubEstimate lines={lines.map(x=>({id:x.variantId,grossCents:(x.p.priceCents||0)*x.quantity,kind:productKind(x.p.tags)}))} onRedeem={mode==='live'&&!promoCode.trim()?onRedeemPoints:undefined}/>
              {promoCode.trim()&&<p className="subtle-note">{t('Promo code entered — Club points are not applied on this order.')}</p>}
              <div className="bag-totals">
                <p><span>{t("Subtotal")}</span><strong>{money(sub)}</strong></p>
                <p><span>{t("Delivery")}</span><strong>{ship===0?t('Free'):money(ship)}</strong></p>
                {clubPoints>0&&<p><span>{t("BigK Club discount")}</span><strong>−{money(clubDiscount)}</strong></p>}
                {promoCode.trim()&&<p><span>{t('Promo code')}</span><strong>{promoCode.trim()}</strong></p>}
                <p className="total"><span>{mode==='demo'?t('Demo total'):t('Estimated total')}</span><strong>{money(estimatedTotal)}</strong></p>
              </div>
              <p className="subtle-note">{mode==='demo'?t('Preview only. Product prices are loaded from the owner’s master; no payment will be taken.'):t('Prices include applicable taxes; final tax calculation is performed by the payment provider. Promo discount is applied at payment.')}</p>
            </section>
            <div className="info-message">{mode==='demo'?t('Preview only. Stock is not reserved and no real order is sent for fulfillment.'):t('Items are reserved for a limited time while you complete payment. Avoid opening multiple checkout sessions.')}</div>
          </aside>
        </div>
      }
      {!lines.length&&error&&<div className="error-message" role="alert">{t(error)}</div>}
    </main>
    <Footer newsletter={false}/>
  </>;
}
