import Link from 'next/link';
import {SimpleHeader} from '@/components/simple-header';
export const dynamic='force-dynamic';
export const metadata={title:'Confirm sign-in',robots:{index:false,follow:false},referrer:'same-origin' as const};
export default async function ConfirmSignIn({searchParams}:{searchParams:Promise<{token?:string}>}){const {token=''}=await searchParams,valid=/^[A-Za-z0-9_-]{32,128}$/.test(token);return <><SimpleHeader/><main id="main" className="page-container"><h1>Confirm your sign-in.</h1>{valid?<section className="panel"><p>Press the button below to sign in to your BIG K account. Your link is used only after you confirm.</p><form method="post" action="/api/account/verify"><input type="hidden" name="token" value={token}/><button className="button dark" type="submit">Sign in to my account</button></form></section>:<p>This link is invalid. <Link href="/account">Request a new sign-in link.</Link></p>}</main></>}
