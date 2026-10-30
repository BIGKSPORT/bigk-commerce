export const checkoutAttemptStorageKey='bigk-checkout-attempt-v1';
/** Keep the idempotency key across reloads without storing contact/address details. */
export async function checkoutAttemptKey(fingerprint:string,fallbackKey:string,storage?:Pick<Storage,'getItem'|'setItem'>){
 try{
  const target=storage??globalThis.sessionStorage;
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(fingerprint))),b=>b.toString(16).padStart(2,'0')).join('');
  const previous=JSON.parse(target.getItem(checkoutAttemptStorageKey)||'null');
  if(previous?.digest===digest&&typeof previous.key==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(previous.key))return previous.key as string;
  target.setItem(checkoutAttemptStorageKey,JSON.stringify({digest,key:fallbackKey}));
 }catch{/* Storage is optional; in-memory retries still reuse fallbackKey. */}
 return fallbackKey;
}
