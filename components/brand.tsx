'use client';
import Link from './site-link';
import ExperienceFooterLink from './experience/footer-link';
import {useSiteLanguage} from './site-language';
import NewsletterSignup from './newsletter-signup';
import PaymentMethods from './payment-methods';
import {seller} from '@/lib/seller';
/** Artwork comes from the supplied identity manual. Padding protects the logo. */
export function Brand({inverse=false}:{inverse?:boolean}){
 const {t,path}=useSiteLanguage();
 return <a href={path('/')} className="brand" aria-label={t('BigK home')} onClick={event=>{if(event.button===0&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey)window.scrollTo({top:0,left:0,behavior:'instant'});}}><img src={inverse?'/brand/bigk-wordmark-white.svg':'/brand/bigk-wordmark.svg'} alt="BigK" width={132} height={31}/></a>;
}
export function Footer({newsletter=true}:{newsletter?:boolean}={}){
 const {t,locale}=useSiteLanguage();
 return <footer>{newsletter&&<NewsletterSignup/>}<div className="footer-top"><div><Brand inverse/><p>Looking good.<br/>Moving fast.</p></div><div><h3>{t('Explore')}</h3>{process.env.NEXT_PUBLIC_SHOP_EXPERIENCE_ENABLED==='true'&&<ExperienceFooterLink/>}<Link href="/?category=All">{t('All products')}</Link><Link href="/?category=Jackets%20%26%20Vests">{t('Jackets & vests')}</Link><Link href="/?category=Pants">{t('Pants')}</Link><Link href="/?category=Accessories">{t('Accessories')}</Link></div><div><h3>{t('Your BigK')}</h3><Link href="/account">{t('Account & orders')}</Link><Link href="/info/delivery">{t('Delivery & returns')}</Link><Link href="/info/contact">{t('Contact')}</Link></div><div><h3>{t('Good to know')}</h3><Link href="/blog">{t('Blog')}</Link><Link href="/info/privacy">{t('Privacy')}</Link><Link href="/info/terms">{t('Terms')}</Link><Link href="/info/about">{t('Our approach')}</Link></div></div><PaymentMethods/><div className="footer-seller"><strong>{seller.name}</strong><span>{seller.address}, {seller.postal} {seller.city}, {seller.country}</span><span>{t('VAT / enterprise number:')} {seller.vat}</span></div><div className="footer-bottom"><span>© {new Date().getFullYear()} BigK. Looking good. Moving fast.</span><span>EUR € · {{en:'English',nl:'Nederlands',fr:'Français',es:'Español',it:'Italiano'}[locale]}</span></div></footer>;
}

