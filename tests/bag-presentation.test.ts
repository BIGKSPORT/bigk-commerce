import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bagMedia,bagSuggestions} from '../lib/bag-presentation';
import {b10Product} from '../lib/b10';
import type {Product} from '../lib/types';
test('bag uses the chosen colour image and suggests only distinct available complementary styles',()=>{
 const shoe=b10Product();shoe.active=true;shoe.approved=true;
 const green=shoe.variants.find(v=>shoe.content!.trade!.identifiers![v.id].colour==='Green')!;
 assert(bagMedia(shoe,green.id).image.includes('green-'));assert.equal(bagMedia(shoe,green.id).colour,'Green');
 const item=(id:string,category:string,stock=5):Product=>({...structuredClone(shoe),id,slug:id,name:id,code:id,category,images:['/products/'+id+'.webp'],content:{},variants:[{id:id+'-M',size:'M',stock,reserved:0,reported:null}]});
 const pants=item('pants','Pants'),scarf=item('scarf','Accessories'),sold=item('sold','Accessories',0),draft={...item('draft','Accessories'),approved:false},unpriced={...item('unpriced','Accessories'),priceCents:null};
 const input=[shoe,pants,scarf,sold,draft,unpriced],bag=[{variantId:green.id,quantity:1}],before=structuredClone(input);
 const selected=bagSuggestions(input,bag);
 assert(selected.length<=2);assert.equal(selected[0].product.id,'scarf');assert(!selected.some(o=>['B10','sold','draft','unpriced'].includes(o.product.id)));
 assert.deepEqual(input,before);assert.deepEqual(bag,[{variantId:green.id,quantity:1}]);assert.deepEqual(bagSuggestions(input,[]),[]);
 assert.equal(bagMedia(pants,'pants-M').image,pants.images[0]);
});
