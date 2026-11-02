import type {Product} from './types';
import {parentId,productGroups,sharedProducts,type ProductGroup} from './product-groups';
export type SeriesKey='ALPIN'|'VELVET'|'CORE'|'NANO-DOWN'|'RIBS';
export type ProductSeries={key:SeriesKey;label:string;parents:readonly string[];logo?:string;logoWidth?:number;logoHeight?:number};
/** Series navigation is merchandising, separate from the inventory-bearing product groups. */
export const productSeries:readonly ProductSeries[]=[
 {key:'ALPIN',label:'ALPIN',logo:'/brand/series-alpin.jpg',logoWidth:591,logoHeight:591,parents:['P001','P006','P008','P012']},
 {key:'VELVET',label:'VELVET',logo:'/brand/series-velvet.jpg',logoWidth:591,logoHeight:213,parents:['P017','P018','P026','P027']},
 {key:'CORE',label:'CORE',logo:'/brand/series-core.png',logoWidth:477,logoHeight:260,parents:['P003','P015','P010']},
 {key:'NANO-DOWN',label:'NANO DOWN',logo:'/brand/series-nano-down.png',logoWidth:591,logoHeight:130,parents:['P019','P021']},
 {key:'RIBS',label:'RIBS',logo:'/brand/series-ribs.png',logoWidth:591,logoHeight:130,parents:['RIBS-LOW-WHITE','RIBS-MEDIUM-WHITE','RIBS-LONG-WHITE']},
];
export function seriesKey(value?:string):SeriesKey|''{return productSeries.find(series=>series.key===value?.trim().toUpperCase().replace(/[\s_]+/g,'-'))?.key||''}
export function inSeries(catalog:Product[],p:Product,key:SeriesKey|''){return !key||Boolean(productSeries.find(series=>series.key===key)?.parents.includes(parentId(p,catalog)))}
export function availableSeries(catalog:Product[]):{series:ProductSeries;groups:ProductGroup[]}[]{const groups=productGroups(sharedProducts(catalog));return productSeries.map(series=>({series,groups:series.parents.flatMap(id=>groups.filter(group=>group.id===id&&group.colours.length>0))})).filter(item=>item.groups.length>0)}
