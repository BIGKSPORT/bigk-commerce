'use client';
import {useLayoutEffect} from 'react';
import {usePathname} from 'next/navigation';

/** Reset only on product-page entry, never on size, photo, or cart state changes. */
export function useProductPageEntry(enabled:boolean){
 const pathname=usePathname();
 useLayoutEffect(()=>{
  if(!enabled||location.hash)return; // Keep intentional deep links.
  const reset=()=>window.scrollTo({top:0,left:0,behavior:'instant'});
  reset();
  // Next's own route scroll runs during commit; finish at the top before painting.
  const frame=requestAnimationFrame(reset);
  return()=>cancelAnimationFrame(frame);
 },[enabled,pathname]);
}
