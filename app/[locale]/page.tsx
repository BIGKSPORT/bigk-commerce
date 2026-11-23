import Home from '../page';
import {getSiteLanguage} from '@/lib/i18n/site-server';
import {seller} from '@/lib/seller';
const descriptions={
  "en": "Technical sportswear, sneakers and accessories combining performance and style. Discover the BIG K collection for sport and everyday life.",
  "nl": "Technische sportkleding, sneakers en accessoires die prestaties en stijl combineren. Ontdek de BIG K-collectie voor sport en elke dag.",
  "fr": "Vêtements de sport techniques, sneakers et accessoires alliant performance et style. Découvrez la collection BIG K pour le sport et le quotidien.",
  "es": "Ropa deportiva técnica, zapatillas y accesorios que combinan rendimiento y estilo. Descubre la colección BIG K para el deporte y el día a día.",
  "it": "Abbigliamento sportivo tecnico, sneakers e accessori che uniscono prestazioni e stile. Scopri la collezione BIG K per lo sport e ogni giorno."
};
const titles = {
  en: 'BIG K® — Technical sportswear and sneakers',
  nl: 'BIG K® — Technische sportkleding en sneakers',
  fr: 'BIG K® — Vêtements de sport techniques et baskets',
  es: 'BIG K® — Ropa deportiva técnica y zapatillas',
  it: 'BIG K® — Abbigliamento sportivo tecnico e sneakers',
};

const siteName = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'BIG K',
  alternateName: 'BIGK',
  url: seller.origin + '/',
};

export const dynamic='force-dynamic';
export async function generateMetadata(){const {locale}=await getSiteLanguage();return {title:{absolute:titles[locale]},description:descriptions[locale],alternates:{canonical:seller.origin+'/'+locale,languages:{en:seller.origin+'/en',nl:seller.origin+'/nl','nl-BE':seller.origin+'/nl','nl-NL':seller.origin+'/nl',fr:seller.origin+'/fr','fr-BE':seller.origin+'/fr','fr-FR':seller.origin+'/fr',es:seller.origin+'/es','es-ES':seller.origin+'/es',it:seller.origin+'/it','it-IT':seller.origin+'/it','x-default':seller.origin+'/en'}}}}
export default function LocalizedHome(props: Parameters<typeof Home>[0]) {
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(siteName)}} />
    <Home {...props} />
  </>;
}

