import type { Metadata, Viewport } from 'next';
import {seller} from '@/lib/seller';
import './globals.css';
import './identity.css';
const publicIndexing = process.env.INDEXING_ENABLED==='true' && process.env.COMMERCE_MODE==='live' && process.env.LIVE_COMMERCE_APPROVED==='true';
export const metadata:Metadata={metadataBase:new URL(process.env.APP_URL||seller.origin),title:{default:'BigK — Looking good. Moving fast.',template:'%s | BigK'},description:'Discover BIGKSPORT performance sportswear and lifestyle apparel. Designed for movement, available to customers across Europe where delivery is supported.',robots:{index:publicIndexing,follow:publicIndexing},manifest:'/manifest.webmanifest',icons:{icon:'/icon.svg'}};
export const viewport:Viewport={themeColor:'#E4002B',colorScheme:'light'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{process.env.DATABASE_SCHEMA==='bigk_staging'&&<div className="test-payment-notice">STAGING · STRIPE TEST PAYMENTS ONLY · NO REAL SHIPMENTS</div>}<a className="skip-link" href="#main">Skip to content</a>{children}</body></html>}
