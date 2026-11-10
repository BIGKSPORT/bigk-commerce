import {products} from '@/lib/db';
import {catalogueFeed} from '@/lib/catalogue-feed';
import {feedLink,feedsEnabled} from '@/lib/product-feed-access';
import {requireAdmin,failure,HttpError} from '@/lib/security';
import {siteLocales} from '@/lib/i18n/site-routing';
export const runtime='nodejs';
export async function GET(req:Request){try{
 await requireAdmin(req);
 const input=new URL(req.url).searchParams.get('page')||'1';if(!/^[1-9]\d{0,4}$/.test(input))throw new HttpError(400,'Choose a valid readiness page.');
 const raw=await products(),report=catalogueFeed(raw),pages=Math.max(1,Math.ceil(report.issues.length/25)),page=Math.min(Number(input),pages);
 return Response.json({styles:report.styles,publicRecords:report.publicProducts,variants:report.variants,eligible:report.items.length,issues:report.issues.slice((page-1)*25,page*25),page,pages,totalIssues:report.issues.length,
  drafts:raw.filter(p=>!p.active||!p.approved).length,publicLanguages:siteLocales,editorLanguages:['en','nl','fr','de','it','es'],checkoutCountries:['BE','NL','FR','DE','LU'],
  feedsEnabled:feedsEnabled(),links:feedsEnabled()?{google:feedLink('google'),meta:feedLink('meta')}:null,
  notes:['Feed eligibility checks catalogue fields, not approval by Google or Meta.','Shipping and return settings must be verified in each merchant account.','Meta CSV is a draft source; validate it in Commerce Manager before ads.','DE, IT and ES public journeys and IT/ES delivery are not activated.','No marketing or analytics tracking is added.']
 },{headers:{'Cache-Control':'no-store'}});
 }catch(error){return failure(error)}}
