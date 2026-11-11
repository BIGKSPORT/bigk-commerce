'use client';
import {useEffect,useRef,type KeyboardEvent} from 'react';

/** Keep editing deliberate: no timer, implicit save, or silent loss on navigation. */
export function useProductEditGuard(value:unknown,busy:boolean,onClose:()=>void){
 const signature=JSON.stringify(value),initial=useRef(signature),dirty=signature!==initial.current;
 useEffect(()=>{
  if(!dirty)return;
  const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};
  window.addEventListener('beforeunload',warn);
  return()=>window.removeEventListener('beforeunload',warn);
 },[dirty]);
 return {dirty,close:()=>{if(!busy&&(!dirty||window.confirm('Discard your unsaved product changes?')))onClose();}};
}

export function preventImplicitProductSave(event:KeyboardEvent<HTMLFormElement>){
 if(event.key==='Enter'&&!event.nativeEvent.isComposing&&event.target instanceof HTMLInputElement&&['text','number','email','search','url','tel'].includes(event.target.type))event.preventDefault();
}
