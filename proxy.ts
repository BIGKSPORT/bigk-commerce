import {NextRequest,NextResponse} from 'next/server';
import {isAlpinLocale} from './lib/alpin-fleece';
/** Locale header is derived from the path, never from a client-supplied preference. */
export function proxy(request:NextRequest){const locale=request.nextUrl.pathname.split('/')[1];const headers=new Headers(request.headers);headers.set('x-bigk-page-language',isAlpinLocale(locale)?locale:'en');return NextResponse.next({request:{headers}})}
export const config={matcher:['/en/products/:path*','/nl/products/:path*','/fr/products/:path*']};
