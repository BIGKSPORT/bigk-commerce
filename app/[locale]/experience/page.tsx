import {notFound} from 'next/navigation';
import {isSiteLocale} from '@/lib/i18n/site-routing';
import {experienceEnabled,experienceData} from '@/lib/experience/server';
import {experienceCopy} from '@/lib/experience/copy';
import config from '@/lib/experience/placements.json';
import Experience from '@/components/experience/experience';
import ExperienceFallback from '@/components/experience/fallback-grid';
import {SimpleHeader} from '@/components/simple-header';
import {seller} from '@/lib/seller';
export const dynamic='force-dynamic';
type Props={params:Promise<{locale:string}>};
export async function generateMetadata({params}:Props){const {locale}=await params;return {title:experienceCopy(locale).label,robots:{index:false,follow:true},alternates:{canonical:seller.origin+'/'+locale+'/experience',languages:{en:seller.origin+'/en/experience',nl:seller.origin+'/nl/experience',fr:seller.origin+'/fr/experience'}}};}
export default async function ExperiencePage({params}:Props){
 const {locale}=await params;if(!isSiteLocale(locale)||!experienceEnabled())notFound();
 const data=await experienceData(locale),copy=experienceCopy(locale),ids=new Set(config.slots.map(s=>s.productId));
 const displayed=data.products.filter(p=>ids.has(p.group?.id||p.id));
 return <><SimpleHeader/><main id="main" data-experience-mode={data.mode}><Experience {...data} locale={locale} copy={copy}><ExperienceFallback products={displayed} locale={locale} copy={copy} fixture={data.mode==='fixture'}/></Experience></main></>;
}
