import type {Product} from '../types';
export type ExperienceMode='fixture'|'staging';
export type ExperienceData={products:Product[];mode:ExperienceMode;freeDeliveryCents:number};
export type Placement={productId:string;x:number;y:number;width:number;height:number;zIndex:number};
export type SceneConfig={desktop:{avif:string;webp:string;width:number;height:number};mobile:{avif:string;webp:string;width:number;height:number};tablet:{avif:string;webp:string;width:number;height:number};bag:{x:number;y:number;width:number;height:number};slots:Placement[];images:Record<string,string>};
