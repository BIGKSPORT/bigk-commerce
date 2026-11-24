/** Public URL projection only; source slugs, IDs and historical orders remain intact. */
export type UrlProduct={id:string;slug:string;tags?:string[];group?:{id:string;slug:string};content?:{trade?:{parentProductId?:string;previousSlugs?:string[]}}};
export const b10WhiteSlug = 'b10-white';
export const isB10White = (productId: string, colour: string) => productId === 'B10' && colour === 'White';
export const urlGroupId=(p:UrlProduct)=>p.group?.id||p.content?.trade?.parentProductId||p.id;
const reviewedPublicSlugs:Record<string,{from:string;to:string}>={
 P015:{from:'corelosse-2-thermal-long-sleeve-jersey',to:'corelosse-2'},
 P019:{from:'nandown-jkt-p019',to:'nano-down-jacket'},
 P021:{from:'nandown-fz-gillet-p021',to:'nano-down-vest'},
 'RIBS-LOW-WHITE':{from:'ribs-low-white-socks',to:'ribs-low-socks'},
 'RIBS-MEDIUM-WHITE':{from:'ribs-medium-white-socks',to:'ribs-medium-socks'},
};
function candidate(p:UrlProduct){
 const slug=p.group?.slug||p.slug,id=urlGroupId(p);
 const reviewed=reviewedPublicSlugs[id];if(reviewed?.from===slug)return reviewed.to;
 const suffix='-'+id.toLowerCase();
 return /^P(?:\d+|-[a-f0-9]{8}-[a-f0-9]{3})$/i.test(id)&&slug.endsWith(suffix)&&slug.length>suffix.length?slug.slice(0,-suffix.length):slug;
}
export function publicProductSlug(p:UrlProduct,catalog:readonly UrlProduct[]){
 const original=p.group?.slug||p.slug,clean=candidate(p),group=urlGroupId(p);
 if(clean===original)return original;
 // Existing addresses take precedence. Never silently move another product's URL.
 const collision=catalog.some(other=>urlGroupId(other)!==group&&!other.tags?.includes('alias:'+group)&&(other.slug===clean||candidate(other)===clean));
 return collision?original:clean;
}
/** Retain attribution/unrelated parameters while replacing only product selection keys. */
export function preserveProductQuery(target:string,query:Record<string,unknown>){
 const [pathname,search='']=target.split('?'),params=new URLSearchParams(search);
 for(const [key,value] of Object.entries(query)){
  if(['colour','colourId','size'].includes(key))continue;
  if(typeof value==='string')params.append(key,value);
  else if(Array.isArray(value))for(const item of value)if(typeof item==='string')params.append(key,item);
 }
 return pathname+(params.size?'?'+params.toString():'');
}

/** Call with sharedProducts(catalog) so reviewed colour families claim one public URL. */
export function publicUrlReserved(slug:string,catalog:readonly UrlProduct[],ownerGroup?:string){
 return (slug===b10WhiteSlug&&ownerGroup!=='B10'&&catalog.some(p=>urlGroupId(p)==='B10'))||catalog.some(p=>urlGroupId(p)!==ownerGroup&&(publicProductSlug(p,catalog)===slug||p.content?.trade?.previousSlugs?.some(previous=>publicProductSlug({...p,slug:previous,group:undefined},catalog)===slug)));
}
