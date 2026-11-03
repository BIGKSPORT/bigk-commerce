'use client';
import Link from './site-link';
import {useSiteLanguage} from './site-language';
import NewsletterSignup from './newsletter-signup';
import {seller} from '@/lib/seller';
/** Artwork comes from the supplied identity manual. Padding protects the logo. */
export function Brand({inverse=false}:{inverse?:boolean}){
 const {t}=useSiteLanguage();
 return <Link href="/" className="brand" aria-label={t('BigK home')}><img src={inverse?'/brand/bigk-wordmark-white.svg':'/brand/bigk-wordmark.svg'} alt="BigK" width={132} height={31}/></Link>;
}
export function Footer({newsletter=true}:{newsletter?:boolean}={}){
 const {t,locale}=useSiteLanguage();
 return <footer>{newsletter&&<NewsletterSignup/>}<div className="footer-top"><div><Brand inverse/><p>Looking good.<br/>Moving fast.</p></div><div><h3>{t('Explore')}</h3><Link href="/?category=All">{t('All products')}</Link><Link href="/?category=Jackets%20%26%20Vests">{t('Jackets & vests')}</Link><Link href="/?category=Pants">{t('Pants')}</Link><Link href="/?category=Accessories">{t('Accessories')}</Link></div><div><h3>{t('Your BigK')}</h3><Link href="/account">{t('Account & orders')}</Link><Link href="/info/delivery">{t('Delivery & returns')}</Link><Link href="/info/contact">{t('Contact')}</Link></div><div><h3>{t('Good to know')}</h3><Link href="/blog">{t('Blog')}</Link><Link href="/info/privacy">{t('Privacy')}</Link><Link href="/info/terms">{t('Terms')}</Link><Link href="/info/about">{t('Our approach')}</Link></div></div><div className="footer-seller"><strong>{seller.name}</strong><span>{seller.address}, {seller.postal} {seller.city}, {seller.country}</span><span>{t('VAT / enterprise number:')} {seller.vat}</span></div><div className="footer-bottom"><span>© {new Date().getFullYear()} BigK. Looking good. Moving fast.</span><span>EUR € · {{en:'English',nl:'Nederlands',fr:'Français'}[locale]}</span></div></footer>;
}
