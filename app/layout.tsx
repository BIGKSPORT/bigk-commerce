import type { Metadata, Viewport } from 'next';
import {seller} from '@/lib/seller';
import './globals.css';
import './identity.css';
export const metadata:Metadata={metadataBase:new URL(process.env.APP_URL||seller.origin),title:{default:'BigK — Looking good. Moving fast.',template:'%s | BigK'},description:'Explore BigK performance apparel. Thoughtful layers, everyday movement and a wardrobe built around your next move.',robots:{index:process.env.INDEXING_ENABLED==='true',follow:process.env.INDEXING_ENABLED==='true'},manifest:'/manifest.webmanifest',icons:{icon:'/icon.svg'}};
export const viewport:Viewport={themeColor:'#E4002B',colorScheme:'light'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{process.env.DATABASE_SCHEMA==='bigk_staging'&&<div className="test-payment-notice">STAGING · STRIPE TEST PAYMENTS ONLY · NO REAL SHIPMENTS</div>}<a className="skip-link" href="#main">Skip to content</a>{children}</body></html>}
