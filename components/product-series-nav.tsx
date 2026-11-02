'use client';
import Image from 'next/image';
import Link from 'next/link';
import {ArrowUpRight} from 'lucide-react';
import {useMemo,type MouseEvent} from 'react';
import type {Product} from '@/lib/types';
import {availableSeries,type SeriesKey} from '@/lib/product-series';
import {groupUrl} from '@/lib/product-groups';
export default function ProductSeriesNav({products,selected,onSelect}:{products:Product[];selected:SeriesKey|'';onSelect:(series:SeriesKey|'')=>void}){
 const available=useMemo(()=>availableSeries(products),[products]);if(!available.length)return null;
 const active=available.find(item=>item.series.key===selected);
 function choose(event:MouseEvent<HTMLAnchorElement>,series:SeriesKey|''){if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();onSelect(series)}
 return <section className="series-discovery" aria-labelledby="series-heading"><div className="series-discovery-heading"><div><span className="eyebrow">THE BIG K COLLECTIONS</span><h2 id="series-heading">Find your series.</h2></div><Link prefetch={false} href="/#catalog" onClick={event=>choose(event,'')} aria-current={!selected?'page':undefined}>Explore all products <ArrowUpRight size={13} aria-hidden="true"/></Link></div>
 <nav className="series-selector" aria-label="Product series">{available.map(({series,groups})=><Link prefetch={false} key={series.key} href={'/?series='+series.key+'#catalog'} onClick={event=>choose(event,series.key)} aria-label={series.label+' series'} aria-current={selected===series.key?'page':undefined} className={'series-brand series-brand-'+series.key.toLowerCase()+' '+(selected===series.key?'is-selected':'')}><span className="series-brand-art">{series.logo?<Image src={series.logo} alt={series.label} width={591} height={series.key==='ALPIN'?591:198} sizes="180px"/>:<strong className={'series-wordmark series-wordmark-'+series.key.toLowerCase()}>{series.label}</strong>}</span><span className="series-brand-caption">{groups.length} models <ArrowUpRight size={13} aria-hidden="true"/></span></Link>)}</nav>
 {active&&<div className="series-models-panel"><div className="series-models-intro"><span className="eyebrow">{active.series.label} SERIES</span><h3>Explore the range.</h3><p>{active.groups.length} individual models.<br/>Choose your colour on the product page.</p></div><nav className="series-models-rail" aria-label={active.series.label+' models'}>{active.groups.map(group=>{const colour=group.colours.find(option=>option.images.length)||group.colours[0];return <Link prefetch={false} className="series-model" key={group.id} href={groupUrl(products,colour)}><span className="series-model-photo">{colour.images[0]?<Image src={colour.images[0]} alt="" width={140} height={170} sizes="140px"/>:<span className="series-model-no-photo">{group.parent.name}</span>}</span><strong>{group.parent.name}</strong><span>{group.colours.length>1?group.colours.length+' colours':colour.colour}</span></Link>})}</nav></div>}
 </section>;
}
