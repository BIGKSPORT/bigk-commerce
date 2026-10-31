import type {Product} from './types';
export type TechnologyFeature={id:string;name:string;kind:'material'|'feature';heading:string;description:string;image:string;alt:string;logo?:string;icon?:'pocket'|'hand'};
const base='/products/alpin-technology/';
export const alpinIntroduction='A dense, brushed outer fleece meets a soft fleece inner surface. A roomy cut, three zipped pockets and integrated thumb openings make ALPIN a practical layer for cooler days and outdoor walks.';
export const alpinFeatures:TechnologyFeature[]=[
{id:'chill-flex',name:'CHILL FLEX',kind:'material',heading:'Warmth starts on the outside.',description:'The brushed outer surface creates a dense fleece structure that helps retain warmth and gives ALPIN its distinctive texture.',image:base+'outer-fleece.webp',alt:'Close-up of the dense, brushed ALPIN outer fleece',logo:base+'chill-flex.png'},
{id:'thermal',name:'THERMAL',kind:'material',heading:'Softness on the inside.',description:'A soft fleece finish provides a comfortable inner surface. Together with the outer fleece, it forms ALPIN’s warmth-focused composite fabric construction.',image:base+'inner-fleece.webp',alt:'ALPIN turned back to show its soft fleece inner surface',logo:base+'thermal.png'},
{id:'secure-pockets',name:'SECURE POCKETS',kind:'feature',heading:'Small essentials, zipped away.',description:'One zipped chest pocket and two zipped front pockets provide enclosed storage for small everyday essentials.',image:base+'zipped-pockets.webp',alt:'ALPIN chest and front pocket zip details',icon:'pocket'},
{id:'thumb-loop',name:'THUMB LOOP',kind:'feature',heading:'Coverage that stays in place.',description:'Integrated thumb openings help keep the cuffs in place when worn over the hands, providing additional coverage.',image:base+'thumb-opening-detail.webp',alt:'ALPIN cuff worn over the hand with the thumb through its opening',icon:'hand'}];
// Explicit, verified article allowlist. Names, family prefixes and tags cannot assign claims.
export function hasAlpinTechnology(product:Pick<Product,'id'|'code'>){return (product.id==='P001'&&/25303101$/.test(product.code))||(product.id==='P002'&&/25303102$/.test(product.code))}
