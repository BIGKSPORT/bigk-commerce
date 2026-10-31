import type {Product} from './types';
import type {TechnologyFeature} from './alpin-technology';
const base='/products/alpin-vest-technology/';
const branding='/products/alpin-technology/';
export const alpinVestIntroduction='The ALPIN Vest Pro combines a textured CHILL FLEX outer fleece with a soft THERMAL inner surface in a sleeveless layer. A stand collar, full front zip and zipped pockets make it a practical addition over a long-sleeve top for cooler days.';
export const alpinVestFeatures:TechnologyFeature[]=[
{id:'chill-flex',name:'CHILL FLEX',kind:'material',heading:'Texture with a purpose.',description:'The brushed outer fleece creates the ALPIN Vest Pro’s distinctive texture and forms part of its warmth-focused material construction.',image:base+'outer-fleece.webp',alt:'Beige ALPIN Vest Pro brushed outer fleece close-up',logo:branding+'chill-flex.png'},
{id:'thermal',name:'THERMAL',kind:'material',heading:'Softness on the inside.',description:'A soft fleece inner surface provides comfortable contact and supports the vest’s warmth-retention construction.',image:base+'inner-fleece.webp',alt:'ALPIN Vest Pro beige fleece inner surface and black edge binding',logo:branding+'thermal.png'},
{id:'secure-pockets',name:'SECURE POCKETS',kind:'feature',heading:'Small essentials, zipped away.',description:'One zipped chest pocket and two zipped lower front pockets provide enclosed storage for small everyday essentials.',image:base+'zipped-pockets.webp',alt:'ALPIN Vest Pro chest and lower front zipped pocket details',icon:'pocket'}];
// Current, visually matched cream-black vest listing only. No automatic family rollout.
export function hasAlpinVestTechnology(product:Pick<Product,'id'|'code'>){return product.id==='P007'&&/25303202$/.test(product.code)}
