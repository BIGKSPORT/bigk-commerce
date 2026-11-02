import type {Product} from './types';
import {parentId,productGroups,sharedProducts,type ProductGroup} from './product-groups';
export type SeriesKey='ALPIN'|'VELVET';
export type ProductSeries={key:SeriesKey;label:string;parents:readonly string[];logo?:string};
/** Series navigation is merchandising, separate from the inventory-bearing product groups. */
export const productSeries:readonly ProductSeries[]=[
 {key:'ALPIN',label:'ALPIN',logo:'/brand/series-alpin.jpg',parents:['P001','P006','P008','P012']},
 {key:'VELVET',label:'VELVET',logo:'/brand/series-velvet.jpg',parents:['P017','P018','P026','P027']},
];
export function seriesKey(value?:string):SeriesKey|''{return productSeries.find(series=>series.key===value?.toUpperCase())?.key||''}
export function inSeries(catalog:Product[],p:Product,key:SeriesKey|''){return !key||Boolean(productSeries.find(series=>series.key===key)?.parents.includes(parentId(p,catalog)))}
export function availableSeries(catalog:Product[]):{series:ProductSeries;groups:ProductGroup[]}[]{const groups=productGroups(sharedProducts(catalog));return productSeries.map(series=>({series,groups:groups.filter(group=>series.parents.includes(group.id)&&group.colours.length>0)})).filter(item=>item.groups.length>0)}
