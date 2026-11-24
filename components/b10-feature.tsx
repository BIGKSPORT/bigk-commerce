import Image from 'next/image';
import Link from './site-link';
import styles from './b10-feature.module.css';
import {colourOptions} from '@/lib/product-groups';
import type {Product} from '@/lib/types';
export default function B10Feature({products}:{products:Product[]}){const product=products.find(p=>p.id==='B10');if(!product)return null;
 const greenProfile=colourOptions(products,product).find(option=>option.colour==='Green')?.images[0];
 return <section className={'b10-feature content-width '+styles.feature} aria-labelledby="b10-feature-title"><div className="b10-feature-copy"><span className="eyebrow">BIG K / B10 SNEAKERS</span><h2 id="b10-feature-title">Step into<br/>the spotlight.</h2><p>Everyday style. Athletic energy. Memory Foam and an unmistakable BIG K identity.</p><p className="b10-colour-line">Black · White · Green <span>EU 36–46</span></p><Link prefetch={false} className="button dark" href={'/products/'+product.slug}>Discover B10</Link></div><Link prefetch={false} className={'b10-feature-image '+styles.image} href={'/products/'+product.slug} aria-label="Explore B10 Sneakers"><Image src="/products/b10/black-profile.webp" alt="BIG K B10 Black sneaker with red heel detail and a white midsole" width={1400} height={1000} sizes="(max-width:700px) 100vw, 60vw"/><div className="b10-mini-colours">{['black','white','green'].map(colour=><Image key={colour} src={(colour==='green'&&greenProfile)||'/products/b10/'+colour+'-profile.webp'} alt={'B10 '+colour+' colourway'} width={240} height={180}/>)}</div></Link></section>}
