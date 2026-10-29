'use client';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {ArrowUp,Palette,Ruler,Scale,ShoppingBag} from 'lucide-react';
import {productFamily} from '@/lib/product-family';
import {money} from '@/lib/format';
import type {Product} from '@/lib/types';
export default function ProductHelp({product,products,mode,onCompare,onChooseSize}:{product:Product;products:Product[];mode:'demo'|'live';onCompare:()=>void;onChooseSize:()=>void}){
 const greeting=`Explore ${product.name}. I can help with the colours, listed sizes, price and delivery setup for this product.`;
 const [messages,setMessages]=useState([{from:'guide',text:greeting}]),[question,setQuestion]=useState(''),[showColours,setShowColours]=useState(false);const end=useRef<HTMLDivElement>(null);
 const family=productFamily(products,product);
 useEffect(()=>{const parent=end.current?.parentElement;if(parent)parent.scrollTop=parent.scrollHeight},[messages,showColours]);
 function answer(text:string){const q=text.toLowerCase();let reply='I can help with this product’s listed colours, sizes, price and delivery. Materials, care and fit measurements are awaiting confirmation.';
 if(/colour|color/.test(q)){reply=family.length>1?'The listed colourways are: '+family.map(p=>p.description.replace(/\s*FZ.*$/i,'')).join(', ')+'. Choose a photo below to view that colour.':'No other colourways are currently listed for this product.';setShowColours(family.length>1)}
 else if(/material|fabric|warm|rain|waterproof|windproof|care|wash|technical/.test(q))reply='Materials, technical performance and care instructions have not been confirmed for this product yet. I cannot verify those details from the photos.';
 else if(/size|fit|measure/.test(q))reply='Listed sizes: '+product.variants.map(v=>v.size).join(', ')+'. '+(mode==='demo'?'Stock is awaiting verification.':'Availability is checked again at checkout.')+' Fit measurements and a size recommendation are not confirmed yet.';
 else if(/price|cost/.test(q))reply=product.priceCents===null?'The price is awaiting approval. You can explore the photos now; purchasing will become available after pricing and stock are confirmed.':`The ${mode==='demo'?'illustrative ':''}price is ${money(product.priceCents)}.${mode==='demo'?' This preview does not take payments.':''}`;
 else if(/deliver|ship|return/.test(q))reply='The current delivery setup covers Belgium, the Netherlands, France, Germany and Luxembourg: free from €100, otherwise €6.95. Final delivery and return terms still need approval.'+(mode==='demo'?' Demo checkout creates no shipment.':'');
 else if(/compare/.test(q))reply='Use Compare below to add this product to your comparison. You can compare up to three catalogue products.';
 else if(/bag|buy|order/.test(q))reply=product.priceCents===null?'Pricing is awaiting approval for this product. You can save it or explore other colours in the meantime.':'Use Choose size below to pick a size before adding this product to your '+(mode==='demo'?'demo bag. No payment is taken.':'bag.');
 setMessages(prev=>[...prev,{from:'you',text},{from:'guide',text:reply}]);setQuestion('');
 }
 function submit(event:FormEvent){event.preventDefault();const text=question.trim();if(text)answer(text)}
 return <div className="product-help"><div className="help-reset"><span>Product guide</span><button onClick={()=>{setMessages([{from:'guide',text:greeting}]);setShowColours(false);setQuestion('')}}>Reset</button></div><div className="help-product-card">{product.images[0]&&<Image src={product.images[0]} alt="" width={50} height={65}/>}<div><strong>BigK</strong><span>{product.name} · {product.description}</span></div></div><div className="help-conversation" aria-live="polite">{messages.map((message,i)=><p key={i} className={'help-message '+message.from}>{message.text}</p>)}{showColours&&<div className="help-colours">{family.map(p=><Link key={p.id} href={'/products/'+p.slug}>{p.images[0]&&<Image src={p.images[0]} alt={p.description} width={75} height={100}/>}<span>{p.description.replace(/\s*FZ.*$/i,'')}</span></Link>)}</div>}<div ref={end}/></div><div className="help-suggestions"><button onClick={()=>answer('Show other colours')}><Palette size={15}/> Other colours</button><button onClick={()=>answer('What sizes are listed?')}><Ruler size={15}/> Listed sizes</button><button onClick={onCompare}><Scale size={15}/> Compare</button><button onClick={onChooseSize}><ShoppingBag size={15}/> Choose size</button></div><form className="help-input" onSubmit={submit}><label className="sr-only" htmlFor="product-help-question">Ask about this product</label><input id="product-help-question" value={question} onChange={e=>setQuestion(e.target.value)} maxLength={300} placeholder="Ask about colours, sizes or delivery"/><button type="submit" aria-label="Send product question" disabled={!question.trim()}><ArrowUp size={19}/></button></form><p className="help-source-note">Answers use the current catalogue. Unconfirmed specifications stay unconfirmed.</p></div>;
}
