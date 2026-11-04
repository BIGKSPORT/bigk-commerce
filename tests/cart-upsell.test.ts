import assert from 'node:assert/strict';import {cartOffer} from '../lib/cart-upsell';import type {Product} from '../lib/types';
function p(id:string,category:string,price:number,stock=10):Product{return {id,slug:id,name:id,description:'',code:id,category,priceCents:price,approved:true,active:true,featured:false,images:['/products/'+id+'.webp'],variants:[{id:id+'-M',size:'M',stock,reserved:0,reported:null}],tags:[],version:0}}
const jacket=p('jacket','Jackets & Vests',7500),socks=p('socks','Accessories',1490),scarf=p('scarf','Accessories',2690),fleece=p('fleece','Fleece',14690);
assert.equal(cartOffer([jacket,socks,scarf,fleece],[]) ,null);
assert.equal(cartOffer([jacket,socks,scarf,fleece],[{variantId:'jacket-M',quantity:1}])?.product.id,'scarf');
assert.equal(cartOffer([jacket,socks,scarf,fleece],[{variantId:'jacket-M',quantity:1}])?.reason,'free_delivery');
const alternate={...jacket,id:'jacket-blue',content:{composition:'',care:'',fit:'',details:'',trade:{parentProductId:'jacket'}},variants:[{...jacket.variants[0],id:'blue-M'}]};
assert.equal(cartOffer([jacket,alternate],[{variantId:'jacket-M',quantity:1}]),null);
for(const blocked of [{...socks,active:false},{...socks,approved:false},{...socks,priceCents:null},{...socks,images:[]},{...socks,variants:[{...socks.variants[0],stock:2,reserved:2}]},{...socks,content:{composition:'',care:'',fit:'',details:'',trade:{identifiers:{'socks-M':{sku:'socks-M',gtin:'',archived:true}}}}}]){
 assert.equal(cartOffer([jacket,blocked],[{variantId:'jacket-M',quantity:1}]),null);
}
assert.equal(cartOffer([fleece,scarf],[{variantId:'fleece-M',quantity:1}])?.reason,'complement');
assert.equal(cartOffer([jacket,fleece],[{variantId:'jacket-M',quantity:1}])?.reason,'complement','Do not push a large extra spend purely for free delivery');
assert.deepEqual(cartOffer([jacket,scarf],[{variantId:'jacket-M',quantity:1}])?.variants.map(v=>v.id),['scarf-M']);
assert.equal(cartOffer([p('shoe','Sneakers',11999),fleece],[{variantId:'shoe-M',quantity:1}]),null,'Hide irrelevant offers instead of forcing one');
console.log('PASS cart upsell: one relevant eligible item, family exclusion, safe stock, shipping fit, no forced expensive delivery upsell.');
