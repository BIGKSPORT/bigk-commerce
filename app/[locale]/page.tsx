import Home from '../page';
import {getSiteLanguage} from '@/lib/i18n/site-server';
import {seller} from '@/lib/seller';
import {seoEnabled,languageAlternates} from '@/lib/product-seo';
import {publicIndexingEnabled} from '@/lib/search-visibility';
export const dynamic='force-dynamic';
type Props={searchParams:Promise<Record<string,string|string[]|undefined>>};
export async function generateMetadata({searchParams}:Props){
 const {locale,t}=await getSiteLanguage(),query=await searchParams,url=seller.origin+'/'+locale;
 if(!seoEnabled())return {title:t('Your collection.'),alternates:{canonical:url,languages:languageAlternates('/')}};
 const filtered=['category','series','saved','size','colour','color','search','q','sort'].some(key=>Boolean(query[key]));
 const description={en:'Explore BIG K sportswear: jackets, vests, fleece, sneakers and accessories. Choose your colour and size from the available collection.',nl:'Ontdek BIG K sportkleding: jassen, bodywarmers, fleece, sneakers en accessoires. Kies je kleur en maat uit de beschikbare collectie.',fr:'Découvrez les vêtements de sport BIG K : vestes, gilets, polaires, baskets et accessoires. Choisissez votre couleur et votre taille parmi la collection disponible.'}[locale];
 const title={en:'Sportswear, fleece and sneakers',nl:'Sportkleding, fleece en sneakers',fr:'Vêtements de sport, polaires et baskets'}[locale];
 return {title,description,alternates:{canonical:url,languages:languageAlternates('/')},robots:{index:publicIndexingEnabled()&&!filtered,follow:publicIndexingEnabled()},
 openGraph:{type:'website',title,description,url,siteName:'BIG K'},twitter:{card:'summary',title,description}};
}
export default Home;
