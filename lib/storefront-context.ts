import {sharedProducts} from './product-groups';
import 'server-only';
import {cache} from 'react';
import {products} from './db';
import {isStagingStorePreview} from './staging-store-preview';
/** React request-scoped memoization only. No shared customer/draft/inventory cache. */
export const storefrontContext=cache(async()=>{
 const [catalog,preview]=await Promise.all([products(),isStagingStorePreview()]);
 return {catalog:sharedProducts(catalog),preview};
});
