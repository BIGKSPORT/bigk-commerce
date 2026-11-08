import {test} from 'node:test';
import assert from 'node:assert/strict';
import {productTranslationsSchema} from '../lib/i18n/product-translation-schema';
import {catalogLocales} from '../lib/i18n/catalog-locales';
import {emptyPresentation} from '../lib/product-presentation';
test('six catalogue languages retain care and technical copy without commercial fields',()=>{
 const value=Object.fromEntries(catalogLocales.map(locale=>[locale,{description:'Reviewed product description',care:'Reviewed care instructions',presentation:{...emptyPresentation(),sizeGuide:'Garment measurements (cm)'}}]));const parsed=productTranslationsSchema.parse(value);assert.equal(Object.keys(parsed).length,6);assert.equal(parsed.it?.care,'Reviewed care instructions');assert.equal(parsed.es?.presentation?.sizeGuide,'Garment measurements (cm)');assert(!productTranslationsSchema.safeParse({nl:{stock:100}}).success);assert(!productTranslationsSchema.safeParse({es:{priceCents:1}}).success);assert(!productTranslationsSchema.safeParse({it:{presentation:{...emptyPresentation(),sizeTable:'Size\tS\tM\nChest\t100'}}}).success);
});
