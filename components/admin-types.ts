import type {Product,ProductContent,Order} from '@/lib/types';
import type {ClubEvent} from '@/lib/club-events';
import type {ClubView} from './club-dashboard';
export type AuditRow={id:number;action:string;entity:string;created_at:string};
export type Overview={mode:'live'|'demo';clubEnabled:boolean;emailConfigured:boolean;paymentsConfigured:boolean;duplicates:{code:string;ids:string[]}[];missingPhotos:string[];pendingPrices:string[]};
export type ClubOrderView={orderId:string;email:string;status:string;blocked:boolean;deliveredAt:string|null;releaseAt:string|null;reviewedAt:string|null;earned:number;released:number;points:number;waitDays:number|null};
export type Booking={event_id:string;email:string;status:string;quantity:number;created_at:string};
export type ClubAdmin={config:{enabled:boolean;waitDays:number|null};members:ClubView[];orders:ClubOrderView[];events:ClubEvent[];bookings:Booking[]};
export type MediaAsset={url:string;name:string;width?:number;height?:number;bytes?:number};
export type MasterData={name:string;variants:number;units:number;records:Record<string,string|number|null>[]};
export type AdminTransport={request:(path:string,init?:RequestInit)=>Promise<any>};
export const blankContent:ProductContent={composition:'',care:'',fit:'',details:''};
export const normalSize=(s:string)=>s.toUpperCase().replace(/^XXXL$/,'3XL').replace(/^XXL$/,'2XL');
export const codeOf=(p:Product)=>p.code.match(/\d{8}$/)?.[0]||p.code;
export function masterFor(master:MasterData|null,p:Product){return master?.records.filter(r=>String(r['SKU incl maat']).startsWith(codeOf(p)+'-'))||[]}
export const dateTime=(s:string)=>new Date(s).toLocaleString('en-GB',{timeZone:'Europe/Brussels',dateStyle:'medium',timeStyle:'short'});
export type AdminOrder=Order;
