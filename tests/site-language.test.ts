import test from 'node:test';import assert from 'node:assert/strict';
import {chooseSiteLocale,localizePath} from '../lib/i18n/site-routing';
import {proxy} from '../proxy';import {NextRequest} from 'next/server';
import {siteLocales} from '../lib/i18n/site-routing';
import {translateSite} from '../lib/i18n/site-copy';
import {sharedCopy} from '../lib/i18n/shared-copy';
import {storefrontCopy} from '../lib/i18n/storefront-copy';
import {checkoutCopy} from '../lib/i18n/checkout-copy';
import {accountCopy} from '../lib/i18n/account-copy';
import {contentCopy} from '../lib/i18n/content-copy';
import {productUiCopy} from '../lib/i18n/product-ui-copy';
import additionalCopy from '../lib/i18n/es-it-copy.json';
import {orderEmailLanguage,orderEmailCopy} from '../lib/i18n/order-email-copy';
import {alpinPaths,alpinCopy} from '../lib/alpin-fleece';
import {careCopy} from '../lib/i18n/care';
await test('language choice is explicit first, then weighted browser language; country is not inferred',()=>{assert.equal(chooseSiteLocale('nl-BE,nl;q=0.9,en;q=0.7'),'nl');assert.equal(chooseSiteLocale('fr-BE,en;q=0.5'),'fr');assert.equal(chooseSiteLocale('nl-BE','fr'),'fr');assert.equal(chooseSiteLocale('de-DE,en;q=.7'),'en');assert.equal(chooseSiteLocale('nl;q=0,fr;q=.4'),'fr');assert.equal(chooseSiteLocale('nl;q=bogus'),'en')});
await test('locale links preserve shared identities, queries and hashes; private APIs stay unchanged',()=>{assert.equal(localizePath('/products/source-product?colourId=P027&size=M#size','nl'),'/nl/products/source-product?colourId=P027&size=M#size');assert.equal(localizePath('/fr/checkout','nl'),'/nl/checkout');assert.equal(localizePath('/en/products/alpin-fleece-jacket?size=L','fr'),'/fr/products/veste-polaire-alpin?size=L');for(const p of ['/api/checkout','/admin','/admin/orders/id','/warehouse','/staff','/staff/setup','https://checkout.stripe.com/test','//other.test/path','/brand/logo.svg'])assert.equal(localizePath(p,'nl'),p)});
await test('root negotiation is temporary, private and query preserving; direct locale wins',()=>{const r=proxy(new NextRequest('https://bigk.test/?category=Fleece',{headers:{'accept-language':'nl-BE'}}));assert.equal(r.status,307);assert.equal(r.headers.get('Location'),'https://bigk.test/nl?category=Fleece');assert.match(r.headers.get('Cache-Control')||'',/no-store/);assert.match(r.headers.get('Vary')||'',/Cookie/);const chosen=proxy(new NextRequest('https://bigk.test/',{headers:{'accept-language':'nl-BE',cookie:'bigk_language_preference=fr'}}));assert.equal(chosen.headers.get('Location'),'https://bigk.test/fr');const legacy=proxy(new NextRequest('https://bigk.test/',{headers:{cookie:'bigk_language=en','accept-language':'nl-BE'}}));assert.equal(legacy.headers.get('Location'),'https://bigk.test/nl');const direct=proxy(new NextRequest('https://bigk.test/nl',{headers:{'accept-language':'fr','x-bigk-page-language':'fr','sec-fetch-dest':'document'}}));assert.equal(direct.headers.get('x-middleware-request-x-bigk-page-language'),'nl');assert.equal(direct.cookies.get('bigk_language')?.value,'nl');assert.equal(direct.cookies.get('bigk_language_preference'),undefined)});


await test('background locale requests do not overwrite a saved explicit language',()=>{const cases:Record<string,string>[]=[{'sec-fetch-dest':'empty'},{'sec-fetch-dest':'empty',rsc:'1','next-router-prefetch':'1'},{}];for(const headers of cases){const response=proxy(new NextRequest('https://bigk.test/nl',{headers:{cookie:'bigk_language_preference=fr',...headers}}));assert.equal(response.cookies.get('bigk_language'),undefined);assert.equal(response.headers.get('x-middleware-request-x-bigk-page-language'),'nl');}const root=proxy(new NextRequest('https://bigk.test/',{headers:{cookie:'bigk_language_preference=fr','accept-language':'nl-BE'}}));assert.equal(root.headers.get('location'),'https://bigk.test/fr');});

await test('Spanish and Italian carry through negotiation, links, receipts and product routes',()=>{
 for(const locale of ['es','it'] as const){
  assert(siteLocales.includes(locale));
  assert.equal(chooseSiteLocale(locale+'-ES,en;q=.5'),locale);
  assert.equal(chooseSiteLocale('nl-BE',locale),locale);
  assert.equal(localizePath('/fr/products/veste-polaire-alpin?colour=Black&size=XL#details',locale),alpinPaths[locale]+'?colour=Black&size=XL#details');
  assert.equal(localizePath('/es/checkout?cancelled=1',locale),'/'+locale+'/checkout?cancelled=1');
  const r=proxy(new NextRequest('https://bigk.test/',{headers:{cookie:'bigk_language_preference='+locale,'accept-language':'nl-BE'}}));
  assert.equal(r.headers.get('location'),'https://bigk.test/'+locale);
  assert.equal(orderEmailLanguage(locale),locale);
  assert.notEqual(orderEmailCopy[locale].confirmation,orderEmailCopy.en.confirmation);
  assert.notEqual(alpinCopy(locale).shortDescription,alpinCopy('en').shortDescription);
  assert.equal(careCopy[locale].instructions['wash-30'].includes('30°C'),true);
 }
});

await test('every existing interface key has Spanish and Italian with matching placeholders',()=>{
 const keys=Object.keys({...sharedCopy,...storefrontCopy,...checkoutCopy,...accountCopy,...contentCopy,...productUiCopy});
 const placeholders=(s:string)=>s.match(/\{\w+\}/g)?.sort()||[];
 for(const key of keys)for(const locale of ['es','it'] as const){
  const translated=(additionalCopy as Record<string,{es:string;it:string}>)[key]?.[locale];
  assert(translated?.trim(),locale+': missing '+key);
  assert.deepEqual(placeholders(translated),placeholders(key),locale+': placeholders in '+key);
  assert.equal(translateSite(locale,key),translated);
 }
 assert.equal(translateSite('es','ALPIN ORIGINAL SKU 25303101'),'ALPIN ORIGINAL SKU 25303101');
});

