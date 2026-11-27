import type {Product} from './types';

type Item = {item_id:string;item_name:string;price:number;quantity:number;item_variant?:string};
type EventName = 'view_item'|'add_to_cart'|'begin_checkout'|'purchase';

export function ecommerceItem(product:Product, quantity=1, variantId?:string):Item|null {
  if(product.priceCents===null)return null;
  return {
    item_id:variantId||product.id,
    item_name:product.name,
    price:product.priceCents/100,
    quantity,
    ...(variantId?{item_variant:variantId}:{}),
  };
}

export function ecommerceEvent(event:EventName, items:(Item|null)[], purchase?:{transactionId:string;merchandiseCents:number;shippingCents:number}) {
  if(process.env.NEXT_PUBLIC_ECOMMERCE_EVENTS!=='true'||typeof window==='undefined')return;
  const known=items.filter((item):item is Item=>item!==null);
  if(!known.length)return;
  const target=window as Window & {dataLayer?:Record<string,unknown>[]};
  const dataLayer=target.dataLayer??=[];
  dataLayer.push({ecommerce:null});
  dataLayer.push({event,ecommerce:{
    currency:'EUR',
    value:purchase?purchase.merchandiseCents/100:Math.round(known.reduce((sum,item)=>sum+item.price*item.quantity,0)*100)/100,
    items:known,
    ...(purchase?{transaction_id:purchase.transactionId,shipping:purchase.shippingCents/100}:{}),
  }});
}
