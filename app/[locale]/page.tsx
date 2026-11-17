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
export const dynamic='force-dynamic';
export async function generateMetadata(){const {locale}=await getSiteLanguage();return {title:{absolute:'BIG K® — Looking good. Moving fast.'},description:descriptions[locale],alternates:{canonical:seller.origin+'/'+locale,languages:{en:seller.origin+'/en',nl:seller.origin+'/nl',fr:seller.origin+'/fr',es:seller.origin+'/es',it:seller.origin+'/it','x-default':seller.origin+'/en'}}}}
export default Home;

