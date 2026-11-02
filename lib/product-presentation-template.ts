import type {Product,ProductContent} from './types';
import {alpinFeatures,alpinIntroduction,hasAlpinTechnology} from './alpin-technology';
import {alpinVestFeatures,alpinVestIntroduction,hasAlpinVestTechnology} from './alpin-vest-technology';
import {nanoKind,nanoFeatures,nanoIntroduction,nanoComposition} from './nano-technology';
import {emptyPresentation} from './product-presentation';
export function presentationTemplate(product:Product|null,current:ProductContent):ProductContent{
 const nano=product&&nanoKind(product),alpin=product&&hasAlpinTechnology(product),vest=product&&hasAlpinVestTechnology(product);
 const presentation={...emptyPresentation(),enabled:true,introduction:nano?nanoIntroduction(nano):alpin?alpinIntroduction:vest?alpinVestIntroduction:current.details,features:structuredClone(nano?nanoFeatures(nano):alpin?alpinFeatures:vest?alpinVestFeatures:[]),detailCaption:alpin?'Construction details shown in the Mist Blue colourway.':vest?'Construction details shown in the beige and black colourway.':'',sizeGuide:nano||alpin?'Model: 185 cm · 78 kg · wears XL.':current.fit,sizeTable:alpin?'Size\tS\tM\tL\tXL\t2XL\t3XL\nShoulder width (cm)\t41.5\t44\t46.5\t49\t51.5\t54\nChest circumference (cm)\t100\t106\t112\t118\t124\t130':''};
 if(alpin)presentation.sizeGuide+=' Supplier body measurements, not garment measurements.';
 return {...current,presentation,composition:nano?nanoComposition:alpin?'Main fabric: 100% polyester.':vest?'':current.composition,fit:alpin?'Roomy fit. No stretch in main fabric.':nano?'Regular fit.':vest?'':current.fit,care:nano||alpin||vest?'Follow the sewn-in care label on your garment.':current.care};
}
