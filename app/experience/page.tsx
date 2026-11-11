import {cookies,headers} from 'next/headers';
import {notFound,redirect} from 'next/navigation';
import {chooseSiteLocale,siteLanguageCookie} from '@/lib/i18n/site-routing';
import {experienceEnabled} from '@/lib/experience/server';
export const dynamic='force-dynamic';
export default async function ExperienceRedirect(){if(!experienceEnabled())notFound();const [h,c]=await Promise.all([headers(),cookies()]);redirect('/'+chooseSiteLocale(h.get('accept-language'),c.get(siteLanguageCookie)?.value)+'/experience');}
