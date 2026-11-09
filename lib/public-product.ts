import type {Product} from './types';
/** Prepared translations remain private until resolved/approved for the multilingual rollout. */
export function publicProductData(product:Product):Product{
 if(!product.content?.translations&&!product.content?.translationPublications)return product;
 const {translations,translationPublications,...content}=product.content;
 return {...product,content};
}
