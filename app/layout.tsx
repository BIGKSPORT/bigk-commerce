import {SiteLanguageProvider} from '@/components/site-language';
import {headers} from 'next/headers';
import type { Metadata, Viewport } from 'next';
import {seller} from '@/lib/seller';
import './globals.css';
import './identity.css';
const publicIndexing = process.env.INDEXING_ENABLED==='true' && process.env.COMMERCE_MODE==='live' && process.env.LIVE_COMMERCE_APPROVED==='true';
export const metadata:Metadata={metadataBase:new URL(process.env.APP_URL||seller.origin),title:{default:'BIG K ® — Looking good. Moving fast.',template:'%s | BIG K ®'},description:'Discover BIG K ® performance sportswear and lifestyle apparel. Designed for movement, available to customers across Europe where delivery is supported.',robots:{index:publicIndexing,follow:publicIndexing},manifest:'/manifest.webmanifest',icons:{icon:'/icon.svg'}};
export const viewport:Viewport={themeColor:'#E4002B',colorScheme:'light'};
export default async function RootLayout({children}:{children:React.ReactNode}){const language=(await headers()).get('x-bigk-page-language');const lang=language==='nl'||language==='fr'?language:'en';return <html lang={lang}><body>{process.env.DATABASE_SCHEMA==='bigk_staging'&&<div className="test-payment-notice">STAGING · STRIPE TEST PAYMENTS ONLY · NO REAL SHIPMENTS</div>}<SiteLanguageProvider locale={lang}><a className="skip-link" href="#main">{lang==='nl'?'Naar de inhoud':lang==='fr'?'Aller au contenu':'Skip to content'}</a>{children}</SiteLanguageProvider></body></html>}
