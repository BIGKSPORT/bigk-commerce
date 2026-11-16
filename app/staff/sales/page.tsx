import SalesWorkspace from '@/components/sales-workspace';
export const dynamic='force-dynamic';
export default function SalesPage(){return process.env.SELLER_PORTAL_ENABLED==='true'?<SalesWorkspace/>:<main id="main"><h1>BIG K · Verkopersportaal</h1><p>Dit portaal is nog niet ingeschakeld.</p></main>;}
