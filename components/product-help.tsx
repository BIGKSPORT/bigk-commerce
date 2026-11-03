'use client';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import Image from 'next/image';
import Link from './site-link';
import {useSiteLanguage} from './site-language';
import {ArrowUp,Palette,Ruler,Scale,ShoppingBag} from 'lucide-react';
import {productFamily} from '@/lib/product-family';
import {money} from '@/lib/format';
import type {Product} from '@/lib/types';
type Reply='greeting'|'default'|'colours'|'technical'|'care'|'material'|'warmth'|'sizes'|'price'|'delivery'|'compare'|'bag';
type Message={from:'guide';reply:Reply}|{from:'you';text:string};
export default function ProductHelp({product,products,mode,onCompare,onChooseSize}:{product:Product;products:Product[];mode:'demo'|'live';onCompare:()=>void;onChooseSize:()=>void}){
 const {t}=useSiteLanguage();
 const [messages,setMessages]=useState<Message[]>([{from:'guide',reply:'greeting'}]),[question,setQuestion]=useState(''),[showColours,setShowColours]=useState(false);const end=useRef<HTMLDivElement>(null);
 const family=productFamily(products,product);
 useEffect(()=>{setMessages([{from:'guide',reply:'greeting'}]);setQuestion('');setShowColours(false)},[product.id]);
 useEffect(()=>{const parent=end.current?.parentElement;if(parent)parent.scrollTop=parent.scrollHeight},[messages,showColours]);
 function replyText(reply:Reply):string{
  switch(reply){
   case 'greeting':return t('Explore {product}. I can help with the colours, listed sizes, price and delivery setup for this product.').replace('{product}',product.name);
   case 'colours':return family.length>1?t('The listed colourways are:')+' '+family.map(p=>p.description.replace(/\s*FZ.*$/i,'')).join(', ')+'. '+t('Choose a photo below to view that colour.'):t('No other colourways are currently listed for this product.');
   case 'technical':return t('A waterproof or windproof rating has not been supplied. Water-repellent fabric is not the same as waterproof. I cannot verify performance from photos.');
   // Source specifications remain untouched: translated interface copy must not invent product claims.
   case 'care':return product.content?.care||t('Care instructions have not been supplied for this product.');
   case 'material':return product.content?.composition||t('Material composition has not been supplied for this product.');
   case 'warmth':return product.content?.details||t('Technical performance information has not been supplied for this product.');
   case 'sizes':return t('Listed sizes:')+' '+product.variants.map(v=>v.size).join(', ')+'. '+t(mode==='demo'?'Stock is awaiting verification.':'Availability is checked again at checkout.')+' '+(product.content?.fit||t('Fit measurements and a size recommendation are not confirmed yet.'));
   case 'price':return product.priceCents===null?t('The price is awaiting approval. You can explore the photos now; purchasing will become available after pricing and stock are confirmed.'):t(mode==='demo'?'The illustrative price is {price}.':'The price is {price}.').replace('{price}',money(product.priceCents))+(mode==='demo'?' '+t('This preview does not take payments.'):'');
   case 'delivery':return t('The current delivery setup covers Belgium, the Netherlands, France, Germany and Luxembourg: free from €100, otherwise €6.95. Final delivery and return terms still need approval.')+(mode==='demo'?' '+t('Demo checkout creates no shipment.'):'');
   case 'compare':return t('Use Compare below to add this product to your comparison. You can compare up to three catalogue products.');
   case 'bag':return product.priceCents===null?t('Pricing is awaiting approval for this product. You can save it or explore other colours in the meantime.'):t(mode==='demo'?'Use Choose size below to pick a size before adding this product to your demo bag. No payment is taken.':'Use Choose size below to pick a size before adding this product to your bag.');
   default:return t('I can help with this product’s listed colours, sizes, price and delivery. Materials, care and fit measurements are awaiting confirmation.');
  }
 }
 function answer(text:string){const q=text.toLowerCase();let reply:Reply='default';
  if(/colour|color|kleur|couleur/.test(q)){reply='colours';setShowColours(family.length>1)}
  else if(/waterproof|windproof|technical|rating|waterdicht|winddicht|technisch|imperméab|coupe-vent|technique/.test(q))reply='technical';
  else if(/care|wash|onderhoud|wassen|entretien|lavage|laver/.test(q))reply='care';
  else if(/material|fabric|materiaal|stof|matière|matiere|tissu/.test(q))reply='material';
  else if(/warm|rain|regen|chaud|pluie/.test(q))reply='warmth';
  else if(/size|fit|measure|maat|maten|pasvorm|taille|coupe|mesure/.test(q))reply='sizes';
  else if(/price|cost|prijs|kosten|prix|coût|cout/.test(q))reply='price';
  else if(/deliver|ship|return|bezorg|lever|verzend|retour|livrais|expédi|expedi/.test(q))reply='delivery';
  else if(/compare|vergelijk|compar/.test(q))reply='compare';
  else if(/bag|buy|order|winkelmand|koop|bestel|panier|achet|commande/.test(q))reply='bag';
  setMessages(prev=>[...prev,{from:'you',text},{from:'guide',reply}]);setQuestion('');
 }
 function submit(event:FormEvent){event.preventDefault();const text=question.trim();if(text)answer(text)}
 return <div className="product-help"><div className="help-reset"><span>{t('Product guide')}</span><button onClick={()=>{setMessages([{from:'guide',reply:'greeting'}]);setShowColours(false);setQuestion('')}}>{t('Reset')}</button></div><div className="help-product-card">{product.images[0]&&<Image src={product.images[0]} alt="" width={50} height={65}/>}<div><strong>BigK</strong><span>{product.name} · {product.description}</span></div></div><div className="help-conversation" aria-live="polite">{messages.map((message,i)=><p key={i} className={'help-message '+message.from}>{message.from==='you'?message.text:replyText(message.reply)}</p>)}{showColours&&<div className="help-colours">{family.map(p=><Link key={p.id} href={'/products/'+p.slug}>{p.images[0]&&<Image src={p.images[0]} alt={p.description} width={75} height={100}/>}<span>{p.description.replace(/\s*FZ.*$/i,'')}</span></Link>)}</div>}<div ref={end}/></div><div className="help-suggestions"><button onClick={()=>answer('Show other colours')}><Palette size={15}/> {t('Other colours')}</button><button onClick={()=>answer('What sizes are listed?')}><Ruler size={15}/> {t('Listed sizes')}</button><button onClick={onCompare}><Scale size={15}/> {t('Compare')}</button><button onClick={onChooseSize}><ShoppingBag size={15}/> {t('Choose size')}</button></div><form className="help-input" onSubmit={submit}><label className="sr-only" htmlFor="product-help-question">{t('Ask about this product')}</label><input id="product-help-question" value={question} onChange={e=>setQuestion(e.target.value)} maxLength={300} placeholder={t('Ask about colours, sizes or delivery')}/><button type="submit" aria-label={t('Send product question')} disabled={!question.trim()}><ArrowUp size={19}/></button></form><p className="help-source-note">{t('Answers use the current catalogue. Unconfirmed specifications stay unconfirmed.')}</p></div>;
}
