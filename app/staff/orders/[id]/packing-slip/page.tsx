import OrderPackingSlip from '@/components/order-packing-slip';
export const dynamic='force-dynamic';
export const metadata={title:'Private warehouse packing slip',robots:{index:false,follow:false}};
export default function Page({params}:{params:Promise<{id:string}>}){return <OrderPackingSlip params={params} staff/>;}
