'use client';
import {Brand} from '../brand';
import {LanguageSwitcher,useSiteLanguage} from '../site-language';
import {ArrowLeft} from 'lucide-react';
import {seller} from '@/lib/seller';
/** Same shared header styling; plain catalogue link avoids Next prefetch touching the DB. */
export default function ExperienceHeader({fixture}:{fixture:boolean}){
 const {path,t,locale}=useSiteLanguage();
 return <header className="simple-header"><Brand/><LanguageSwitcher/><a href={(fixture?seller.origin:'')+path('/')}><ArrowLeft size={14}/>{locale==='es'||locale==='it'?'Back to collection':t('Back to collection')}</a></header>;
}
