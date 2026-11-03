export const siteLocales=['en','nl','fr'] as const;
export type SiteLocale=typeof siteLocales[number];
export const siteLanguageCookie='bigk_language';
export function isSiteLocale(value:unknown):value is SiteLocale{return typeof value==='string'&&(siteLocales as readonly string[]).includes(value)}
export function chooseSiteLocale(accept:string|null,choice?:string){if(isSiteLocale(choice))return choice;const values=(accept||'').split(',').map((s,i)=>{const [tag,...p]=s.trim().toLowerCase().split(';'),q=p.find(x=>x.trim().startsWith('q='));return {locale:tag.split('-')[0],q:q?Number(q.trim().slice(2)):1,i}}).filter(x=>isSiteLocale(x.locale)&&Number.isFinite(x.q)&&x.q>0&&x.q<=1).sort((a,b)=>b.q-a.q||a.i-b.i);return (values[0]?.locale||'en') as SiteLocale}
export function localizePath(href:string,locale:SiteLocale){
 if(!href.startsWith('/')||href.startsWith('//')||/^\/(api|admin|warehouse)(\/|\?|#|$)/.test(href))return href;
 const [pathname,...suffix]=href.split(/(?=[?#])/),segments=pathname.split('/');
 if(isSiteLocale(segments[1]))segments.splice(1,1);
 const path=segments.join('/')||'/';
 if(/\.[a-z0-9]+$/i.test(path)&&!path.startsWith('/products/'))return href;
 // The source-reviewed ALPIN pages retain their established localized slugs.
 const alpin=['/products/alpin-fleece-jacket','/products/alpin-fleecejas','/products/veste-polaire-alpin'];
 const target=alpin.includes(path)?alpin[siteLocales.indexOf(locale)]:path;
 return '/'+locale+(target==='/'?'':target)+suffix.join('');
}
