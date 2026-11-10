import {createHmac,timingSafeEqual} from 'node:crypto';
import {publicIndexingEnabled} from './search-visibility';
import {seller} from './seller';
export type FeedVendor='google'|'meta';
export function feedsEnabled(){return process.env.PRODUCT_FEEDS_ENABLED!=='false'&&publicIndexingEnabled()}
export function feedAccessToken(vendor:FeedVendor){
 const secret=process.env.ADMIN_MFA_KEY;if(!secret||secret.length<32)return null;
 // Domain-separated bearer credential: does not disclose or grant any admin access.
 return createHmac('sha256',secret).update('bigk/catalogue-feed/v1/'+seller.origin+'/'+vendor+'/'+(process.env.PRODUCT_FEED_VERSION||'1')).digest('hex');
}
export function validFeedToken(vendor:FeedVendor,value:string|null){const expected=feedAccessToken(vendor);return !!expected&&!!value&&/^[a-f0-9]{64}$/.test(value)&&timingSafeEqual(Buffer.from(expected,'hex'),Buffer.from(value,'hex'))}
export function feedLink(vendor:FeedVendor){const token=feedAccessToken(vendor);return token?seller.origin+'/api/product-feeds/'+vendor+'?token='+token:null}
