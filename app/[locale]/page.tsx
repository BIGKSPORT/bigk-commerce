import Home from '../page';
import {getSiteLanguage} from '@/lib/i18n/site-server';
import {seller} from '@/lib/seller';
export const dynamic='force-dynamic';
export async function generateMetadata(){const {locale}=await getSiteLanguage();return {title:'LOOKING GOOD. MOVING FAST.',alternates:{canonical:seller.origin+'/'+locale,languages:{en:seller.origin+'/en',nl:seller.origin+'/nl',fr:seller.origin+'/fr',es:seller.origin+'/es',it:seller.origin+'/it','x-default':seller.origin+'/en'}}}}
export default Home;

