import {publicIndexingEnabled} from '@/lib/search-visibility';
import SavedCartSync from '@/components/saved-cart-sync';
import {SiteLanguageProvider} from '@/components/site-language';
import {isSiteLocale} from '@/lib/i18n/site-routing';
import {translateSite} from '@/lib/i18n/site-copy';
import {headers} from 'next/headers';
import type { Metadata, Viewport } from 'next';
import {seller} from '@/lib/seller';
import './globals.css';
import './identity.css';
const publicIndexing = publicIndexingEnabled();
export const metadata:Metadata={metadataBase:new URL(process.env.APP_URL||seller.origin),title:{default:'BIG K ® — Looking good. Moving fast.',template:'%s | BIG K ®'},description:'Discover BIG K ® performance sportswear and lifestyle apparel. Designed for movement, available to customers across Europe where delivery is supported.',robots:{index:publicIndexing,follow:publicIndexing},manifest:'/manifest.webmanifest',icons:{icon:'/icon.svg'}};
export const viewport:Viewport={themeColor:'#E4002B',colorScheme:'light'};
export default async function RootLayout({children}:{children:React.ReactNode}){const language=(await headers()).get('x-bigk-page-language');const lang=isSiteLocale(language)?language:'en';return <html lang={lang} data-payment-methods={process.env.PAYMENT_METHOD_BADGES_ENABLED==='false'?'off':'on'}><body>{process.env.DATABASE_SCHEMA==='bigk_staging'&&<div className="test-payment-notice">STAGING · STRIPE TEST PAYMENTS ONLY · NO REAL SHIPMENTS</div>}<SiteLanguageProvider locale={lang}><a className="skip-link" href="#main">{translateSite(lang,'Skip to content')}</a>{children}<SavedCartSync/></SiteLanguageProvider></body></html>}


