import {alpinPublicProduct} from './alpin-fleece';
import type {Product} from './types';
export function aliasTarget(product:{tags:string[]}){return product.tags.find(t=>t.startsWith('alias:'))?.slice(6)}
export function visibleProducts<T extends {tags:string[]}>(products:T[]){return products.filter(p=>!aliasTarget(p))}
export function resolveProduct<T extends {id:string;slug:string;tags:string[];content?:{trade?:{previousSlugs?:string[]}}}>(products:T[],slug:string){const found=products.find(p=>p.slug===slug||p.content?.trade?.previousSlugs?.includes(slug));return found?products.find(p=>p.id===(aliasTarget(found)||found.id)):undefined}
export function publicProducts<T extends {tags:string[];active:boolean;approved:boolean;content?:{trade?:{identifiers?:Record<string,{archived?:boolean}>}};variants:{id:string}[]}>(catalog:T[]):T[]{return visibleProducts(catalog).filter(p=>p.active&&p.approved).map(p=>({...p,variants:p.variants.filter(v=>!p.content?.trade?.identifiers?.[v.id]?.archived)})).map(p=>('code' in p&&'name' in p&&'description' in p?alpinPublicProduct(p as unknown as Product) as unknown as T:p))}
