import {publicProductData} from '../lib/public-product';
import type {Product} from '../lib/types';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {productTranslationsSchema} from '../lib/i18n/product-translation-schema';
import {catalogLocales} from '../lib/i18n/catalog-locales';
import {emptyPresentation} from '../lib/product-presentation';
test('six catalogue languages retain care and technical copy without commercial fields',()=>{
 const value=Object.fromEntries(catalogLocales.map(locale=>[locale,{description:'Reviewed product description',care:'Reviewed care instructions',presentation:{...emptyPresentation(),sizeGuide:'Garment measurements (cm)'}}]));const parsed=productTranslationsSchema.parse(value);assert.equal(Object.keys(parsed).length,6);assert.equal(parsed.it?.care,'Reviewed care instructions');assert.equal(parsed.es?.presentation?.sizeGuide,'Garment measurements (cm)');assert(!productTranslationsSchema.safeParse({nl:{stock:100}}).success);assert(!productTranslationsSchema.safeParse({es:{priceCents:1}}).success);assert(!productTranslationsSchema.safeParse({it:{presentation:{...emptyPresentation(),sizeTable:'Size\tS\tM\nChest\t100'}}}).success);
});

test('public product payload omits draft language text without mutating stored content',()=>{
 const product={id:'draft-test',name:'Source name',content:{composition:'Verified material',care:'Verified care',fit:'Verified fit',details:'Verified details',translations:{es:{description:'Unapproved private draft'}}}} as Product;
 const output=publicProductData(product);assert.equal(output.content?.translations,undefined);assert.equal(output.content?.composition,'Verified material');assert.equal(product.content?.translations?.es?.description,'Unapproved private draft');assert(!JSON.stringify(output).includes('Unapproved private draft'));
});
