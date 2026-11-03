import {notFound} from 'next/navigation';
import {isSiteLocale} from '@/lib/i18n/site-routing';
export default async function LocaleLayout({children,params}:{children:React.ReactNode;params:Promise<{locale:string}>}){if(!isSiteLocale((await params).locale))notFound();return children}
