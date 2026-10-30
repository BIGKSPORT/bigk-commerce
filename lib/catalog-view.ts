export function aliasTarget(product:{tags:string[]}){return product.tags.find(t=>t.startsWith('alias:'))?.slice(6)}
export function visibleProducts<T extends {tags:string[]}>(products:T[]){return products.filter(p=>!aliasTarget(p))}
export function resolveProduct<T extends {id:string;slug:string;tags:string[]}>(products:T[],slug:string){const found=products.find(p=>p.slug===slug);return found?products.find(p=>p.id===(aliasTarget(found)||found.id)):undefined}
