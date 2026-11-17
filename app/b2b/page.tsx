import B2BPortal from '@/components/b2b-portal';
export const dynamic='force-dynamic';
export default function B2BPage(){return process.env.B2B_PORTAL_ENABLED==='true'?<B2BPortal/>:<main id="main"><h1>BIG K · B2B</h1><p>Het B2B-portaal is nog niet geopend. Neem contact op met BIG K.</p></main>;}
