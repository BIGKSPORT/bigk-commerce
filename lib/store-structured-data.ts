import {seller} from './seller';
export function storeStructuredData(){return {'@context':'https://schema.org','@graph':[
 {'@type':'Organization','@id':seller.origin+'/#organization',name:'BIG K',legalName:seller.name,url:seller.origin,vatID:seller.vat,address:{'@type':'PostalAddress',streetAddress:seller.address,postalCode:seller.postal,addressLocality:seller.city,addressCountry:'BE'}},
 {'@type':'WebSite','@id':seller.origin+'/#website',name:'BIG K',url:seller.origin,inLanguage:['en','nl','fr'],publisher:{'@id':seller.origin+'/#organization'}}
]}}
