'use client';
import {useEffect} from 'react';
import {usePathname} from 'next/navigation';
export default function SavedCartSync(){
 const pathname=usePathname();
 useEffect(()=>{window.dispatchEvent(new Event('bigk-cart-change'))},[pathname]);
 useEffect(()=>{
  if(location.pathname.startsWith('/admin')||location.pathname.startsWith('/warehouse'))return;
  let stopped=false,hasCart=false,sending=false,queued=false,last='';
  const isOrder=()=>/^\/(?:en\/|nl\/|fr\/)?order(?:\/|$)/.test(location.pathname);
  async function flush(){if(stopped||isOrder()||/^\/(?:en\/|nl\/|fr\/)?(?:admin|warehouse|account)(?:\/|$)/.test(location.pathname))return;if(sending){queued=true;return}let items;try{items=JSON.parse(localStorage.getItem('bigk-bag-v2')||'[]')}catch{return}if(!Array.isArray(items)||(!items.length&&!hasCart))return;const data={items,stage:/\/checkout(?:\/|$)/.test(location.pathname)?'checkout':'bag'},key=JSON.stringify(data);if(key===last)return;sending=true;try{const response=await fetch('/api/cart',{method:'POST',headers:{'Content-Type':'application/json'},body:key,keepalive:true});if(response.ok){const saved=await response.json();hasCart=saved.hasCart;last=key}}catch{/* A cart backup must never block shopping. */}finally{sending=false;if(queued){queued=false;void flush()}}}
  async function start(){try{const response=await fetch('/api/cart',{cache:'no-store'});if(response.ok){const remote=await response.json();hasCart=remote.hasCart;if(!stopped&&!isOrder()&&localStorage.getItem('bigk-bag-v2')===null&&remote.items?.length){localStorage.setItem('bigk-bag-v2',JSON.stringify(remote.items));location.reload();return}}}catch{}if(!stopped)void flush()}
  void start();const timer=setInterval(()=>void flush(),1000);const onChange=()=>void flush();window.addEventListener('storage',onChange);window.addEventListener('bigk-cart-change',onChange);window.addEventListener('pagehide',onChange);
  return()=>{stopped=true;clearInterval(timer);window.removeEventListener('storage',onChange);window.removeEventListener('bigk-cart-change',onChange);window.removeEventListener('pagehide',onChange)};
 },[]);
 return null;
}
