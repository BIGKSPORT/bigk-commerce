import type {SiteLocale} from './site-routing';
import {sharedCopy} from './shared-copy';
import {storefrontCopy} from './storefront-copy';
import {checkoutCopy} from './checkout-copy';
import {accountCopy} from './account-copy';
import {contentCopy} from './content-copy';
import {productUiCopy} from './product-ui-copy';
import additionalCopy from './es-it-copy.json';
const copy:Record<string,{nl:string;fr:string}>={...sharedCopy,...storefrontCopy,...checkoutCopy,...accountCopy,...contentCopy,...productUiCopy};
export function translateSite(locale:SiteLocale,text:string){return locale==='en'?text:locale==='es'||locale==='it'?(additionalCopy as Record<string,{es:string;it:string}>)[text]?.[locale]||text:copy[text]?.[locale]||text}

