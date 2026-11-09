'use client';
import {useEffect,useState} from 'react';
import {productCategories} from '@/lib/product-categories';
import type {AdminTransport} from './admin-types';
export function useProductCategories(transport:AdminTransport,current:string){
 const [names,setNames]=useState<string[]>([...productCategories]);
 useEffect(()=>{let active=true;transport.request('/api/admin/categories').then(data=>{if(active)setNames(data.categories.filter((c:{active:boolean})=>c.active).map((c:{name:string})=>c.name));}).catch(()=>{});return ()=>{active=false;};},[transport]);
 return [...new Set([...names,...(current?[current]:[])])];
}
