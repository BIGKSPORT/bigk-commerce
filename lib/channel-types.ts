export const channelNames=['bol','ankorstore','faire','amazon'] as const;
export type ChannelName=typeof channelNames[number];
export type EanState='ready'|'missing'|'invalid'|'duplicate'|'unverified'|'archived';
export type ChannelStockRow={variantId:string;productId:string;name:string;article:string;colour:string;size:string;sku:string;ean:string;canonicalEan:string;eanState:EanState;stock:number;reserved:number;available:number;buffer:number;plannedChannelAvailable:number;policyVersion:number;stockIssue:boolean;sellerSubmittedUnits:number;sellerPaidUnits:number};
export type ChannelLink={id:string;version:number;channel:ChannelName;accountKey:string;externalId:string;variantId:string;ean:string;externalTitle:string;paused:boolean;updatedAt:string;state:'ready'|'paused'|'stale'|'blocked';reason:string};
export type ChannelOverview={rows:ChannelStockRow[];links:ChannelLink[];channels:{name:ChannelName;label:string;connection:'not_connected';lastSuccessfulSync:null}[];summary:{variants:number;missing:number;invalid:number;duplicate:number;unverified:number;ready:number;stockIssues:number;sellerSubmittedUnits:number;sellerPaidUnits:number};updatedAt:string};
