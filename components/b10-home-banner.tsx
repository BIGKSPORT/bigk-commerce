import Image from 'next/image';
import Link from 'next/link';
import {groupUrl,type ColourOption} from '@/lib/product-groups';
import type {SiteLocale} from '@/lib/i18n/site-routing';
import type {Product} from '@/lib/types';
import styles from './b10-home-banner.module.css';

const labels = {
  en: {heading:'B10 Sneakers',subtitle:'Three colours. One signature.',Black:'Black',Green:'Green',White:'White'},
  nl: {heading:'B10 Sneakers',subtitle:'Drie kleuren. Eén herkenbare stijl.',Black:'Zwart',Green:'Groen',White:'Wit'},
  fr: {heading:'Baskets B10',subtitle:'Trois coloris. Une même signature.',Black:'Noir',Green:'Vert',White:'Blanc'},
  es: {heading:'Zapatillas B10',subtitle:'Tres colores. Una misma firma.',Black:'Negro',Green:'Verde',White:'Blanco'},
  it: {heading:'Sneakers B10',subtitle:'Tre colori. Una firma inconfondibile.',Black:'Nero',Green:'Verde',White:'Bianco'},
} satisfies Record<SiteLocale, Record<string,string>>;

export default function B10HomeBanner({catalog,options,locale,path}:{
  catalog:Product[];
  options:ColourOption[];
  locale:SiteLocale;
  path:(href:string)=>string;
}) {
  const copy=labels[locale];
  return <section className={styles.banner} aria-labelledby="b10-banner-title">
    <div className={styles.heading}>
      <h2 id="b10-banner-title">{copy.heading}</h2>
      {options.length===3&&<p>{copy.subtitle}</p>}
    </div>
    <div className={styles.colours} style={{gridTemplateColumns:`repeat(${options.length},minmax(0,1fr))`}}>
      {options.map(option=>{
        const label=copy[option.colour as 'Black'|'Green'|'White']||option.colour;
        return <Link className={styles.colour} key={option.id} href={path(groupUrl(catalog,option))} prefetch={false}>
          <div className={styles.photo}>
            <Image src={option.images[0]} alt="" fill sizes="(max-width: 700px) 32vw, 18vw"/>
          </div>
          <span>{label} <span aria-hidden="true">↗</span></span>
        </Link>;
      })}
    </div>
  </section>;
}
