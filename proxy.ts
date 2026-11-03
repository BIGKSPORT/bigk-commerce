import {NextRequest,NextResponse} from 'next/server';
import {chooseSiteLocale,isSiteLocale,localizePath,siteLanguageCookie} from './lib/i18n/site-routing';
export function proxy(request:NextRequest){
 const pathname=request.nextUrl.pathname,first=pathname.split('/')[1];
 const locale=isSiteLocale(first)?first:'en';
 if(pathname==='/'||(!isSiteLocale(first)&&/^\/(products|checkout|account|order|blog|info|newsletter)(\/|$)/.test(pathname))){
  const target=chooseSiteLocale(request.headers.get('accept-language'),request.cookies.get(siteLanguageCookie)?.value),url=request.nextUrl.clone();url.pathname=localizePath(pathname,target);
  const response=NextResponse.redirect(url,307);response.headers.set('Cache-Control','private, no-store');response.headers.set('Vary','Accept-Language, Cookie');return response;
 }
 const h=new Headers(request.headers);h.set('x-bigk-page-language',locale);h.set('x-bigk-page-path',pathname);
 const response=NextResponse.next({request:{headers:h}});
 if(isSiteLocale(first))response.cookies.set(siteLanguageCookie,locale,{path:'/',maxAge:31536000,sameSite:'lax',secure:request.nextUrl.protocol==='https:'});
 return response;
}
export const config={matcher:['/((?!api|admin|warehouse|_next|.*\\..*).*)']};
