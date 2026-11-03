'use client';
import {usePathname} from 'next/navigation';
import {createContext,useContext,type ReactNode} from 'react';
import {isSiteLocale,localizePath,siteLanguageCookie,siteLocales,type SiteLocale} from '@/lib/i18n/site-routing';
import {translateSite} from '@/lib/i18n/site-copy';
const Context=createContext<SiteLocale|null>(null);
export function SiteLanguageProvider({locale,children}:{locale:SiteLocale;children:ReactNode}){const pathname=usePathname(),candidate=pathname?.split('/')[1];return <Context.Provider value={isSiteLocale(candidate)?candidate:locale}>{children}</Context.Provider>}
export function useSiteLanguage(){const selected=useContext(Context),locale=selected||'en';return {locale,t:(text:string)=>translateSite(locale,text),path:(href:string)=>selected?localizePath(href,locale):href}}
export function LanguageSwitcher(){const {locale,t}=useSiteLanguage();return <label className="site-language"><span className="sr-only">{t('Language')}</span><select aria-label={t('Language')} value={locale} onChange={event=>{const language=event.target.value;if(!isSiteLocale(language))return;document.cookie=siteLanguageCookie+'='+language+'; Path=/; Max-Age=31536000; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'');window.location.assign(localizePath(location.pathname+location.search+location.hash,language))}}>{siteLocales.map(language=><option key={language} value={language}>{({en:'English',nl:'Nederlands',fr:'Français'})[language]}</option>)}</select></label>}
