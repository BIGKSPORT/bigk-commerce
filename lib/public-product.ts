import type {Product} from './types';
/** Prepared translations remain private until resolved/approved for the multilingual rollout. */
export function publicProductData(product:Product):Product{
 if(!product.content?.translations)return product;
 const {translations,...content}=product.content;
 return {...product,content};
}
