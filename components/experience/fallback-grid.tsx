import Image from 'next/image';
import {localizePath} from '@/lib/i18n/site-routing';
import {localizedMoney} from '@/lib/i18n/config';
import {seller} from '@/lib/seller';
import type {SiteLocale} from '@/lib/i18n/site-routing';
import type {Product} from '@/lib/types';
import type {ExperienceCopy} from '@/lib/experience/copy';
import config from '@/lib/experience/placements.json';
import styles from './experience.module.css';
export default function ExperienceFallback({products,locale,copy,fixture}:{products:Product[];locale:SiteLocale;copy:ExperienceCopy;fixture:boolean}){
 const images:Record<string,string>=config.images;
 return <section className={styles.fallback} aria-label={copy.grid}><h2>{copy.grid}</h2><div>{products.map(p=><article key={p.id}><a href={(fixture?seller.origin:'')+localizePath('/products/'+p.slug,locale)}><Image src={images[p.id+':'+p.content?.trade?.colour]||images[p.id]||p.images[0]} alt={p.name} width={200} height={240} sizes="(max-width:360px) 42vw, 200px" loading="lazy"/><h3>{p.name}</h3></a><p>{p.priceCents===null?'—':localizedMoney(p.priceCents,locale)}</p><a href={(fixture?seller.origin:'')+localizePath('/products/'+p.slug,locale)}>{copy.details}</a></article>)}</div></section>;
}
