import {test} from 'node:test';
import assert from 'node:assert/strict';
import {publicIndexingEnabled} from '../lib/search-visibility';
import robots from '../app/robots';
const keys=['VERCEL_ENV','DATABASE_SCHEMA','INDEXING_ENABLED','COMMERCE_MODE','LIVE_COMMERCE_APPROVED'] as const;
test('search launch switch opens public crawling while staging and private routes stay excluded',()=>{
 const saved=Object.fromEntries(keys.map(k=>[k,process.env[k]]));try{
 Object.assign(process.env,{VERCEL_ENV:'production',DATABASE_SCHEMA:'bigk',INDEXING_ENABLED:'true',COMMERCE_MODE:'live',LIVE_COMMERCE_APPROVED:'true'});
 assert(publicIndexingEnabled());const value=robots();assert.equal(value.sitemap,'https://bigk.be/sitemap.xml');const rules=value.rules as {allow:string[];disallow:string[]}[];assert.deepEqual(rules[0].allow,['/','/api/media/*.webpfor(const path of ['/admin','/staff','/warehouse','/api/','/checkout','/account','/order','/nl/checkout','/fr/account'])assert(rules[0].disallow.includes(path));
 for(const [key,value] of [['VERCEL_ENV','preview'],['DATABASE_SCHEMA','bigk_staging'],['INDEXING_ENABLED','false'],['COMMERCE_MODE','demo'],['LIVE_COMMERCE_APPROVED','false']] as const){const old=process.env[key];process.env[key]=value;assert.equal(publicIndexingEnabled(),false);assert.deepEqual(robots().rules,[{userAgent:'*',disallow:'/'}]);assert.equal(robots().sitemap,undefined);process.env[key]=old;}
 }finally{for(const key of keys){if(saved[key]===undefined)delete process.env[key];else process.env[key]=saved[key];}}
});
]);for(const path of ['/admin','/staff','/warehouse','/api/','/checkout','/account','/order','/nl/checkout','/fr/account'])assert(rules[0].disallow.includes(path));
 for(const [key,value] of [['VERCEL_ENV','preview'],['DATABASE_SCHEMA','bigk_staging'],['INDEXING_ENABLED','false'],['COMMERCE_MODE','demo'],['LIVE_COMMERCE_APPROVED','false']] as const){const old=process.env[key];process.env[key]=value;assert.equal(publicIndexingEnabled(),false);assert.deepEqual(robots().rules,[{userAgent:'*',disallow:'/'}]);assert.equal(robots().sitemap,undefined);process.env[key]=old;}
 }finally{for(const key of keys){if(saved[key]===undefined)delete process.env[key];else process.env[key]=saved[key];}}
});
