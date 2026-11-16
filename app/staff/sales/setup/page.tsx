import SalesSetup from '@/components/sales-setup';
export const dynamic='force-dynamic';
export default function SetupPage(){return process.env.SELLER_PORTAL_ENABLED==='true'?<SalesSetup/>:<main id="main"><h1>Verkopersportaal niet beschikbaar</h1></main>;}
