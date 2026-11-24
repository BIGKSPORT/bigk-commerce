import {NextRequest,NextResponse} from 'next/server';
import {chooseSiteLocale,isSiteLocale,localizePath,siteLanguageCookie,siteLanguagePreferenceCookie} from './lib/i18n/site-routing';
export function proxy(request:NextRequest){
 const pathname=request.nextUrl.pathname,first=pathname.split('/')[1];
 if(pathname==='/admin'||pathname.startsWith('/admin/')){
  const headers=new Headers(request.headers);
  headers.set('x-bigk-page-path',pathname);
  return NextResponse.next({request:{headers}});
 }
 const locale=isSiteLocale(first)?first:'en';
 if(pathname==='/'||(!isSiteLocale(first)&&/^\/(products|checkout|account|order|blog|info|newsletter)(\/|$)/.test(pathname))){
  const target=chooseSiteLocale(request.headers.get('accept-language'),request.cookies.get(siteLanguagePreferenceCookie)?.value),url=request.nextUrl.clone();url.pathname=localizePath(pathname,target);
  const response=NextResponse.redirect(url,307);response.headers.set('Cache-Control','private, no-store');response.headers.set('Vary','Accept-Language, Cookie');return response;
 }
 const h=new Headers(request.headers);h.set('x-bigk-page-language',locale);h.set('x-bigk-page-path',pathname);
 const response=NextResponse.next({request:{headers:h}});
 // Keep the current page language for account flows. Only the selector saves a preference.
 if(isSiteLocale(first)&&request.headers.get('sec-fetch-dest')==='document')response.cookies.set(siteLanguageCookie,locale,{path:'/',maxAge:31536000,sameSite:'lax',secure:request.nextUrl.protocol==='https:'});
 return response;
}
export const config={matcher:['/admin/:path*','/((?!api|admin|warehouse|_next|.*\\..*).*)']};

