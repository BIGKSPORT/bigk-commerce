import {headers} from 'next/headers';
import Link from '@/components/site-link';
import {SimpleHeader} from '@/components/simple-header';
import {isSiteLocale,type SiteLocale} from '@/lib/i18n/site-routing';
import {translateSite} from '@/lib/i18n/site-copy';
export const dynamic='force-dynamic';
async function language(){const value=(await headers()).get('x-bigk-page-language');return isSiteLocale(value)?value:'en'}
function text(locale:SiteLocale,key:string){return translateSite(locale,key)}
export async function generateMetadata(){const locale=await language();return {title:text(locale,'Confirm sign-in'),robots:{index:false,follow:false},referrer:'same-origin' as const}}
export default async function ConfirmSignIn({searchParams}:{searchParams:Promise<{token?:string}>}){
 const [{token=''},locale]=await Promise.all([searchParams,language()]),valid=/^[A-Za-z0-9_-]{32,128}$/.test(token),t=(key:string)=>text(locale,key);
 return <><SimpleHeader/><main id="main" className="page-container"><h1>{t('Confirm your sign-in.')}</h1>{valid?<section className="panel"><p>{t('Press the button below to sign in to your BIG K account. Your link is used only after you confirm.')}</p><form method="post" action="/api/account/verify"><input type="hidden" name="token" value={token}/><button className="button dark" type="submit">{t('Sign in to my account')}</button></form></section>:<p>{t('This link is invalid.')} <Link href="/account">{t('Request a new sign-in link.')}</Link></p>}</main></>;
}

