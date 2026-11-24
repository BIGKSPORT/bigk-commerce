import {alpinCopy,alpinGroupId,alpinProductColour,alpinProductUrl,alpinVariantMapping} from '@/lib/alpin-fleece';
import {hasAlpinTechnology} from '@/lib/alpin-technology';
import {publicProducts} from '@/lib/catalog-view';
import {liveReady} from '@/lib/commerce';
import {products} from '@/lib/db';
import {groupUrl,productGroups} from '@/lib/product-groups';
import {validGtin} from '@/lib/product-identifiers';
import {searchDescription} from '@/lib/product-search-data';
import {publicIndexingEnabled} from '@/lib/search-visibility';
import {seller} from '@/lib/seller';
import {checkoutCountries,shippingCharge} from '@/lib/shipping-policy';

type Offer = {
 id:string; group:string; name:string; description:string; colour:string; size:string;
 priceCents:number|null; inStock:boolean; path:string; images:string[]; gtin?:string;
};

const escapeXml = (value:string) => value
 .replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu,'')
 .replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[character]!));
const tag = (name:string,value:string) => '<g:'+name+'>'+escapeXml(value)+'</g:'+name+'>';
const absolute = (path:string) => new URL(path,seller.origin).href;
const eur = (amount:number) => (amount/100).toFixed(2)+' EUR';

function item(offer:Offer) {
 if(offer.priceCents===null||!offer.description.trim()||!offer.images[0])return '';
 const price=offer.priceCents;
 return '<item>'+[
  tag('id',offer.id),
  tag('item_group_id',offer.group),
  tag('title', [offer.name,offer.colour,offer.size].filter(Boolean).join(' – ').slice(0,150)),
  tag('description',offer.description.trim().slice(0,5000)),
  tag('link',absolute(offer.path)),
  tag('image_link',absolute(offer.images[0])),
  ...offer.images.slice(1,11).map(image=>tag('additional_image_link',absolute(image))),
  tag('availability',offer.inStock?'in_stock':'out_of_stock'),
  tag('price',eur(price)),
  tag('condition','new'),
  tag('brand','BIG K'),
  ...(offer.colour?[tag('color',offer.colour)]:[]),
  ...(offer.size?[tag('size',offer.size)]:[]),
  ...(offer.gtin&&validGtin(offer.gtin)?[tag('gtin',offer.gtin)]:[]),
  ...checkoutCountries.map(country=>'<g:shipping>'+tag('country',country)+tag('price',eur(shippingCharge(price,country)))+'</g:shipping>'),
 ].join('')+'</item>';
}

export async function GET() {
 if(!publicIndexingEnabled())return new Response(null,{status:404});
 if(!liveReady())return new Response(null,{status:503});

 const catalog=await products();
 const visible=publicProducts(catalog);
 const offers:Offer[]=[];
 for(const group of productGroups(visible)) {
  for(const option of group.colours) {
   const product=option.product;
   if(hasAlpinTechnology(product))continue;
   for(const variant of option.variants) {
    offers.push({
     id:variant.id,group:group.id,name:group.parent.name,
     description:searchDescription(product)||searchDescription(group.parent),
     colour:option.colour,size:variant.size,priceCents:product.priceCents,
     inStock:variant.stock>variant.reserved,path:'/en'+groupUrl(catalog,option,variant.size),
     images:option.images,gtin:product.content?.trade?.identifiers?.[variant.id]?.gtin,
    });
   }
  }
 }
 for(const product of visible.filter(hasAlpinTechnology)) {
  for(const variant of alpinVariantMapping(product)) {
   offers.push({
    id:variant.sku,group:alpinGroupId,name:product.name,
    description:searchDescription(product)||alpinCopy('en').shortDescription,
    colour:alpinProductColour(product),size:variant.size,priceCents:product.priceCents,
    inStock:variant.stock>variant.reserved,path:alpinProductUrl('en',product,variant.size),
    images:product.images,gtin:variant.gtin,
   });
  }
 }
 const items=offers.map(item).filter(Boolean);
 if(!items.length||new Set(offers.map(offer=>offer.id)).size!==offers.length)
  return new Response(null,{status:503});
 return new Response([
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel>',
  '<title>BIG K Catalogue</title><link>'+seller.origin+'/en</link><description>BIG K public product catalogue</description>',
  ...items,
  '</channel></rss>',
 ].join('\n'),{headers:{'Content-Type':'application/rss+xml; charset=utf-8','Cache-Control':'no-store'}});
}
