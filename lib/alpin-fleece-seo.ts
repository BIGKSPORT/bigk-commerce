import type {Metadata} from 'next';
import type {Product} from './types';
import {seller} from './seller';
import {alpinArticle,alpinColour,alpinProductColour,alpinProductUrl,alpinCopy,alpinGroupId,alpinName,alpinPaths,alpinVariantMapping,alpinVariantUrl,type AlpinLocale} from './alpin-fleece';
import {searchSku,searchDescription,searchShippingDetails} from './product-search-data';
import {alpinUI} from './i18n/alpin-ui';
export function alpinMetadata(locale:AlpinLocale,products:Product[],indexable:boolean):Metadata {
 const copy=alpinCopy(locale),url=seller.origin+alpinPaths[locale],image=products[0]?.images[0],translation=products[0]?.content?.localizedCopy,seoTitle=translation?.seoTitle||`${products[0]?.name||alpinName} | BIG K`,seoDescription=translation?.seoDescription||copy.seoDescription;
 return {title:{absolute:seoTitle},description:seoDescription,alternates:{canonical:url,languages:{en:seller.origin+alpinPaths.en,nl:seller.origin+alpinPaths.nl,fr:seller.origin+alpinPaths.fr,es:seller.origin+alpinPaths.es,it:seller.origin+alpinPaths.it,'x-default':seller.origin+alpinPaths.en}},robots:{index:indexable,follow:indexable},openGraph:{type:'website',title:seoTitle,description:seoDescription,url,siteName:'Big K',locale:({en:'en_GB',nl:'nl_NL',fr:'fr_FR',es:'es_ES',it:'it_IT'})[locale],alternateLocale:['en_GB','nl_NL','fr_FR','es_ES','it_IT'].filter(value=>value!==(({en:'en_GB',nl:'nl_NL',fr:'fr_FR',es:'es_ES',it:'it_IT'})[locale])),images:image?[{url:seller.origin+image,alt:products[0]?.name||alpinName}]:[]},twitter:{card:'summary_large_image',title:seoTitle,description:seoDescription,images:image?[seller.origin+image]:[]}};
}
export function alpinStructuredData(locale:AlpinLocale,products:Product[]) {
 const copy=alpinCopy(locale),url=seller.origin+alpinPaths[locale],groupName=products[0]?.name||alpinName,groupDescription=products[0]?searchDescription(products[0])||copy.shortDescription:copy.shortDescription,groupId=url+'#product';
 return {'@context':'https://schema.org','@graph':[
  {'@type':'ProductGroup','@id':groupId,productGroupID:alpinGroupId,name:groupName,description:groupDescription,url,brand:{'@type':'Brand',name:'Big K'},variesBy:['https://schema.org/color','https://schema.org/size'],hasVariant:products.flatMap(product=>alpinVariantMapping(product).map(variant=>{
   const variantUrl=seller.origin+alpinProductUrl(locale,product,variant.size);
   return {'@type':'Product','@id':variantUrl+'#variant',inProductGroupWithID:alpinGroupId,isVariantOf:{'@type':'ProductGroup','@id':groupId,productGroupID:alpinGroupId,name:groupName,description:groupDescription},name:product.name,description:product.content?.localizedCopy?.description||copy.shortDescription,sku:searchSku(variant.sku,variant.sku),...(variant.gtin?{['gtin'+variant.gtin.length]:variant.gtin}:{}),color:alpinProductColour(product,locale),size:variant.size,image:product.images.map(image=>seller.origin+image),url:variantUrl,offers:{'@type':'Offer',url:variantUrl,price:product.priceCents===null?undefined:(product.priceCents/100).toFixed(2),priceCurrency:'EUR',...(product.priceCents===null?{}:{shippingDetails:searchShippingDetails(product.priceCents)}),availability:product.active&&product.approved&&variant.stock-variant.reserved>0?'https://schema.org/InStock':'https://schema.org/OutOfStock'}};
  }))},
  {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:alpinUI[locale].collection,item:seller.origin+'/#catalog'},{'@type':'ListItem',position:2,name:products[0]?.name||alpinName,item:url}]},
 ]};
}



