import type { Metadata, Viewport } from 'next';
import './globals.css';
import './identity.css';
export const metadata:Metadata={title:{default:'BigK — Looking good. Moving fast.',template:'%s | BigK'},description:'Explore BigK performance apparel. Thoughtful layers, everyday movement and a wardrobe built around your next move.',robots:{index:process.env.COMMERCE_MODE==='live'&&process.env.LIVE_COMMERCE_APPROVED==='true',follow:process.env.COMMERCE_MODE==='live'&&process.env.LIVE_COMMERCE_APPROVED==='true'},manifest:'/manifest.webmanifest',icons:{icon:'/icon.svg'}};
export const viewport:Viewport={themeColor:'#E4002B',colorScheme:'light'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a>{children}</body></html>}
