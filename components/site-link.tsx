'use client';
import Link from 'next/link';
import type {ComponentProps} from 'react';
import {useSiteLanguage} from './site-language';
/** Existing explicit locale links (e.g. ALPIN language tabs) keep their target. */
export default function SiteLink({href,...props}:ComponentProps<typeof Link>){const {path}=useSiteLanguage();const target=typeof href==='string'&&!/^\/(en|nl|fr)(\/|\?|#|$)/.test(href)?path(href):href;return <Link {...props} href={target}/>}
