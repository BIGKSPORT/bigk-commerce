import {headers} from 'next/headers';
import {isSiteLocale,localizePath} from './site-routing';
import {translateSite} from './site-copy';
export async function getSiteLanguage(){const h=await headers(),value=h.get('x-bigk-page-language'),locale=isSiteLocale(value)?value:'en';return {locale,t:(text:string)=>translateSite(locale,text),path:(href:string)=>localizePath(href,locale)}}
