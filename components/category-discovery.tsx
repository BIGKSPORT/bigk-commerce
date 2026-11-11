'use client';
import Image from 'next/image';
import Link from './site-link';
import {useSiteLanguage} from './site-language';
import {categoryLabel,type CategoryOption} from '@/lib/category-labels';
import {parentId} from '@/lib/product-groups';
import {orderedValues} from '@/lib/catalog-organization';
import type {Product} from '@/lib/types';
import styles from './storefront-merchandising.module.css';
export default function CategoryDiscovery({categories,products,productOrder=[]}:{categories:CategoryOption[];products:Product[];productOrder?:string[]}){
 const {locale}=useSiteLanguage(),copy=locale==='es'?{title:'Encuentra tu próxima prenda.',intro:'Explora la colección por categoría.',style:'modelo',styles:'modelos',browse:'Explorar'}:locale==='it'?{title:'Trova il tuo prossimo capo.',intro:'Esplora la collezione per categoria.',style:'modello',styles:'modelli',browse:'Esplora'}:locale==='nl'?{title:'Vind jouw volgende laag.',intro:'Ontdek de collectie per categorie.',style:'stijl',styles:'stijlen',browse:'Ontdek'}:locale==='fr'?{title:'Trouvez votre prochaine pièce.',intro:'Découvrez la collection par catégorie.',style:'modèle',styles:'modèles',browse:'Découvrir'}:{title:'Find your next layer.',intro:'Explore the collection by category.',style:'style',styles:'styles',browse:'Explore'};
 const ordered=orderedValues(products,productOrder,p=>parentId(p,products));
 const cards=categories.filter(c=>c.active!==false).map(category=>({category,items:ordered.filter(p=>p.category===category.name)})).filter(c=>c.items.some(p=>p.images.length)).slice(0,6);
 if(!cards.length)return null;
 return <section className={'content-width '+styles.section} aria-label={copy.intro} data-category-discovery><header className={styles.heading}><div><span className="eyebrow">BIG K / COLLECTION</span><h2>{copy.title}</h2><p>{copy.intro}</p></div></header><div className={styles.categories}>{cards.map(({category,items})=>{const name=categoryLabel(category.name,locale,category.labels),product=items.find(p=>p.images.length)!;return <Link key={category.name} prefetch={false} href={'/?category='+encodeURIComponent(category.name)+'#catalog'} className={styles.category} data-category={category.name}><div><Image src={product.images[0]} alt={name} width={600} height={750} sizes="(max-width: 600px) 44vw, 30vw"/></div><span><strong>{name}</strong><small>{new Set(items.map(p=>parentId(p,products))).size} {new Set(items.map(p=>parentId(p,products))).size===1?copy.style:copy.styles}</small></span><b>{copy.browse} ↗</b></Link>;})}</div></section>;
}

