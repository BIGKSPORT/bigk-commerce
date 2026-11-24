'use client';
import {useSiteLanguage} from './site-language';
import type {Product} from '@/lib/types';
import {parseSizeTable} from '@/lib/product-presentation';
import {TechnologyBlocks} from './product-technology';
import styles from './product-technology.module.css';
const featureLabels = {
 en: {material:'Material technology',feature:'Functional feature'},
 nl: {material:'Materiaaltechnologie',feature:'Functioneel detail'},
 fr: {material:'Technologie des matières',feature:'Détail fonctionnel'},
 es: {material:'Tecnología de materiales',feature:'Detalle funcional'},
 it: {material:'Tecnologia dei materiali',feature:'Dettaglio funzionale'},
};

export default function EditableProductTechnology({product}:{product:Product}){const {locale,t}=useSiteLanguage();const labels=locale==='nl'?{detail:'BIG K ® / TOT IN HET DETAIL',technology:'Technologie & constructie',materials:'Materiaal & pasvorm',size:'Maattabel',measure:'Productafmetingen'}:locale==='fr'?{detail:'BIG K ® / LE SOUCI DU DÉTAIL',technology:'Technologie et conception',materials:'Matières et coupe',size:'Guide des tailles',measure:'Mesures du produit'}:{detail:'BIG K ® / BUILT INTO EVERY DETAIL',technology:'Technology & Construction',materials:'Materials & Fit',size:'Size guide',measure:'Product size measurements'};const p=product.content?.presentation;if(!p?.enabled)return null;const rows=parseSizeTable(p.sizeTable);return <div className={'content-width '+styles.wrapper} data-editable-product-technology>{p.features.length>0&&<section><header className={styles.heading}><span className="eyebrow">{t(labels.detail)}</span><h2>{t(labels.technology)}</h2>{p.detailCaption&&<p>{p.detailCaption}</p>}</header><TechnologyBlocks features={p.features} labels={featureLabels[locale]}/></section>}<section className={styles.care}><h2>{t(labels.materials)}</h2><p style={{whiteSpace:'pre-line'}}>{product.content?.composition}</p><p style={{whiteSpace:'pre-line'}}>{product.content?.fit}</p></section><section className={styles.care}><h2>{t(labels.size)}</h2><p style={{whiteSpace:'pre-line'}}>{p.sizeGuide}</p>{rows.length>0&&<div className={styles.tableScroll} tabIndex={0} role="region" aria-label={t(labels.measure)}><table className="admin-table"><thead><tr>{rows[0].map((cell,i)=><th scope="col" key={i}>{cell}</th>)}</tr></thead><tbody>{rows.slice(1).map((row,i)=><tr key={i}>{row.map((cell,j)=>j===0?<th scope="row" key={j}>{cell}</th>:<td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>}</section></div>}


