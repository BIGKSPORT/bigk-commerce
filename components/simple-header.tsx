'use client';
import Link from './site-link';
import {ArrowLeft} from 'lucide-react';
import {Brand} from './brand';
import {LanguageSwitcher,useSiteLanguage} from './site-language';
export function SimpleHeader(){const {t}=useSiteLanguage();return <header className="simple-header"><Brand/><LanguageSwitcher/><Link href="/"><ArrowLeft size={14}/>{t('Back to collection')}</Link></header>}
