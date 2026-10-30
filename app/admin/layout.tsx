import type {Metadata} from 'next';
export const metadata:Metadata={robots:{index:false,follow:false}};
import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
export default async function AdminLayout({children}:{children:React.ReactNode}) {
 if(process.env.VERCEL_ENV==='preview' && process.env.ADMIN_CANONICAL_ORIGIN){
  const origin=new URL(process.env.ADMIN_CANONICAL_ORIGIN);
  if(origin.protocol!=='https:'||origin.username||origin.password||origin.pathname!=='/')throw Error('Invalid admin canonical origin.');
  const host=(await headers()).get('host');
  // Host is compared only to a configured destination, never used as trust input.
  if(host!==origin.host)redirect(origin.origin+'/admin');
 }
 return children;
}
