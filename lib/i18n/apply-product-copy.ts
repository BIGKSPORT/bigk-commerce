import type {Product,ProductTranslation} from '../types';
/** Only the server's reviewed, current-locale projection is supplied here. */
export function applyProductCopy(product:Product,copy?:ProductTranslation):Product{
 if(!copy)return product;
 const content={...product.content,composition:product.content?.composition||'',care:product.content?.care||'',fit:product.content?.fit||'',details:product.content?.details||'',localizedCopy:copy};
 for(const key of ['composition','care','fit','details','presentation'] as const)if(copy[key]!==undefined)(content as Record<string,unknown>)[key]=copy[key];
 if(copy.seoTitle||copy.seoDescription)content.trade={...content.trade,...(copy.seoTitle?{seoTitle:copy.seoTitle}:{}),...(copy.seoDescription?{seoDescription:copy.seoDescription}:{})};
 return {...product,description:copy.description||product.description,content};
}
