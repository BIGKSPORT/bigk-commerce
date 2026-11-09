import {z} from 'zod';
import type {CatalogLocale} from './i18n/catalog-locales';
import type {Product} from './types';
const plain=(max:number)=>z.string().trim().max(max);
const copySchema=z.object({eyebrow:plain(80),title:plain(120),description:plain(500),button:plain(50),alt:plain(200)}).strict();
export type MerchCopy=z.infer<typeof copySchema>;
export const blankCopy:MerchCopy={eyebrow:'',title:'',description:'',button:'',alt:''};
const translations=z.object({en:copySchema,nl:copySchema.optional(),fr:copySchema.optional(),de:copySchema.optional(),it:copySchema.optional(),es:copySchema.optional()}).strict();
export const safeCampaignLink=(value:string)=>!value.split(/[?#]/)[0].split('/').some(v=>v==='.'||v==='..'||/%2e/i.test(v))&&value.startsWith('/')&&!value.startsWith('//')&&!/[\\\s\u0000-\u001f]/.test(value)&&!/%(?:2f|5c|0[0-9a-f]|1[0-9a-f])/i.test(value)&&!/^\/(?:[a-z]{2}\/)?(?:api|admin|staff|warehouse|checkout|account|order)(?:\/|[?#]|$)/i.test(value);
const href=z.string().max(250).refine(v=>v===''||safeCampaignLink(v),'Choose a public shop URL beginning with /.');
const image=z.string().max(250);
const date=z.union([z.literal(''),z.iso.datetime()]);
const schedule={startsAt:date,endsAt:date};
const timing=(v:{startsAt:string;endsAt:string})=>!v.startsAt||!v.endsAt||v.endsAt>v.startsAt;
export const organizationSchema=z.object({enabled:z.boolean(),categoryCards:z.boolean(),compactCatalog:z.boolean().optional(),hideDefaultFeature:z.boolean(),categoryOrder:z.array(plain(80).min(1)).max(200),productOrder:z.array(plain(100).min(1)).max(1000)}).strict().refine(v=>new Set(v.categoryOrder).size===v.categoryOrder.length&&new Set(v.productOrder).size===v.productOrder.length,'Use each category and product once in the order.');
export const merchandisingSchema=z.object({
 organization:organizationSchema.optional(),
 enabled:z.boolean(),catalogMode:z.enum(['expanded','curated']),
 announcement:z.object({enabled:z.boolean(),copy:translations,href,...schedule}).strict().refine(timing,'End must be after start.'),
 hero:z.object({enabled:z.boolean(),copy:translations,image,mobileImage:image,href,...schedule}).strict().refine(timing,'End must be after start.'),
 looks:z.array(z.object({id:z.uuid(),enabled:z.boolean(),copy:translations,image,...schedule,items:z.array(z.object({productId:plain(100).min(1),x:z.number().min(5).max(95),y:z.number().min(5).max(95)}).strict()).max(4)}).strict().refine(timing,'End must be after start.')).max(6),
 shelves:z.array(z.object({id:z.uuid(),enabled:z.boolean(),copy:translations,href,productIds:z.array(plain(100).min(1)).max(8)}).strict()).max(6),
}).strict().refine(v=>new Set(v.looks.map(l=>l.id)).size===v.looks.length,'Look identifiers must be unique.');
export type Merchandising=z.infer<typeof merchandisingSchema>;
export function emptyMerchandising():Merchandising{return {enabled:false,catalogMode:'expanded',announcement:{enabled:false,copy:{en:{...blankCopy}},href:'',startsAt:'',endsAt:''},hero:{enabled:false,copy:{en:{...blankCopy}},image:'',mobileImage:'',href:'/#catalog',startsAt:'',endsAt:''},looks:[],shelves:[]};}
export function campaignCopy(copy:Merchandising['hero']['copy'],locale:CatalogLocale):MerchCopy{const translated=copy[locale];return Object.fromEntries(Object.keys(blankCopy).map(k=>[k,translated?.[k as keyof MerchCopy]?.trim()||copy.en[k as keyof MerchCopy]])) as MerchCopy;}
export function campaignActive(v:{enabled:boolean;startsAt:string;endsAt:string},now:string){return v.enabled&&(!v.startsAt||v.startsAt<=now)&&(!v.endsAt||v.endsAt>now);}
export function merchProductAvailable(p:Product){return p.active&&p.approved&&p.priceCents!==null&&p.priceCents>0&&p.images.length>0&&p.variants.some(v=>!p.content?.trade?.identifiers?.[v.id]?.archived&&v.stock-v.reserved>0);}
/** Only published, currently active content and available public product references leave the server. */
export function publicMerchandising(doc:Merchandising,catalog:Product[],now=new Date().toISOString()):Merchandising|undefined{
 if(!doc.enabled)return undefined;
 const available=new Set(catalog.filter(merchProductAvailable).map(p=>p.id));
 const empty=emptyMerchandising();
 return {...doc,announcement:campaignActive(doc.announcement,now)?doc.announcement:empty.announcement,hero:campaignActive(doc.hero,now)?doc.hero:empty.hero,looks:doc.looks.filter(l=>campaignActive(l,now)).map(l=>({...l,items:l.items.filter(i=>available.has(i.productId))})).filter(l=>l.items.length>0),shelves:doc.shelves.filter(s=>s.enabled).map(s=>({...s,productIds:s.productIds.filter(id=>available.has(id))})).filter(s=>s.productIds.length>0)};
}
