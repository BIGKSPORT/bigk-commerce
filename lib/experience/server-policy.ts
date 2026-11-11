import {shipping} from '../commerce';
import {experienceFixtures} from './fixtures';
import type {ExperienceData} from './types';
import type {SiteLocale} from '../i18n/site-routing';

export function experienceEnabled(){return process.env.NEXT_PUBLIC_SHOP_EXPERIENCE_ENABLED==='true'&&process.env.VERCEL_ENV!=='production';}
/** Reuse the existing server shipping policy; no second hardcoded delivery threshold. */
export function freeDeliveryThreshold(){
 let upper=1;
 while(shipping(upper)!==0&&upper<Number.MAX_SAFE_INTEGER/2)upper*=2;
 if(shipping(upper)!==0)throw Error('No free-delivery threshold is available.');
 let lower=0;
 while(lower<upper){const mid=Math.floor((lower+upper)/2);if(shipping(mid)===0)upper=mid;else lower=mid+1;}
 return lower;
}
export async function experienceData(locale:SiteLocale):Promise<ExperienceData>{
 if(!experienceEnabled())throw Error('Experience is disabled.');
 // Credentials alone never opt this new page into a database. Production is never read here.
 const staging=process.env.EXPERIENCE_STAGING_DATA==='true';
 if(staging){
  if(process.env.DATABASE_PROVIDER!=='postgres'||process.env.DATABASE_SCHEMA!=='bigk_staging'||!process.env.DATABASE_URL)throw Error('Explicit staging mode needs the isolated staging database configuration.');
  if(process.env.STRIPE_SECRET_KEY&&!process.env.STRIPE_SECRET_KEY.startsWith('sk_test_'))throw Error('Experience staging cannot use live payment keys.');
  const [{products},{localizedPublicCatalog}]=await Promise.all([import('../db'),import('../localized-public-catalog')]);
  return {products:(await localizedPublicCatalog(await products(),locale)).filter(p=>p.priceCents!==null&&p.images.length),mode:'staging',freeDeliveryCents:freeDeliveryThreshold()};
 }
 return {products:experienceFixtures(),mode:'fixture',freeDeliveryCents:freeDeliveryThreshold()};
}
