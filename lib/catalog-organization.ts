import type {Merchandising} from './merchandising-content';
/** Stable ordering: newly published entries follow the owner's pinned order. No products disappear. */
export function orderedValues<T>(values:T[],order:readonly string[],key:(value:T)=>string):T[]{
 const ranks=new Map(order.map((id,index)=>[id,index]));
 return values.map((value,index)=>({value,index})).sort((a,b)=>(ranks.get(key(a.value))??Infinity)-(ranks.get(key(b.value))??Infinity)||a.index-b.index).map(item=>item.value);
}
export function emptyOrganization():NonNullable<Merchandising['organization']>{return {enabled:false,categoryCards:true,hideDefaultFeature:false,categoryOrder:[],productOrder:[]};}

/** Clothing leads the brand; accessories and uncategorized items follow, unless explicitly reordered. */
export const defaultCategoryOrder=['Jackets & Vests','Fleece','Long sleeves','Thermal','Pants','Sneakers','Accessories','Other'] as const;
export function orderedCategories<T>(values:T[],order:readonly string[],key:(value:T)=>string){const tail=(value:T)=>['Accessories','Other'].includes(key(value));return orderedValues([...orderedValues(values.filter(v=>!tail(v)),defaultCategoryOrder,key),...orderedValues(values.filter(tail),defaultCategoryOrder,key)],order,key);}
