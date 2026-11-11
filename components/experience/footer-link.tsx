'use client';
import Link from '../site-link';
import {useSiteLanguage} from '../site-language';
export default function ExperienceFooterLink(){const {locale}=useSiteLanguage();return <Link href="/experience">{locale==='nl'?'Shop de ervaring':locale==='fr'?'Vivez le shopping':'Shop the experience'}</Link>;}
