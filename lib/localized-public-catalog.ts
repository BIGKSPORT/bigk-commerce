import {cache} from 'react';
import {publicProducts} from './catalog-view';
import {getSiteLanguage} from './i18n/site-server';
import {shopFeatures} from './shop-features';
import {localizedPublicProducts} from './i18n/published-product-translations';
import type {SiteLocale} from './i18n/site-routing';
import type {Product} from './types';
const translationFeatures=cache(shopFeatures);
export async function localizedPublicCatalog(raw:Product[],requestedLocale?:SiteLocale){if(!raw.some(p=>p.content?.translationPublications&&Object.keys(p.content.translationPublications).length))return publicProducts(raw);const locale=requestedLocale||(await getSiteLanguage()).locale;if(locale==='en')return publicProducts(raw);const features=await translationFeatures();return localizedPublicProducts(raw,locale,features.catalog_translation_drafts);}
