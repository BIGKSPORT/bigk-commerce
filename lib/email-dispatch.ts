import {after} from 'next/server';import {deliverEmails} from './email';
/** Email delivery runs after committed payment/shipping changes, never inside a DB transaction. */
export function scheduleEmailDelivery(){if(process.env.EMAIL_DELIVERY_ENABLED!=='true'||!process.env.RESEND_API_KEY)return;try{after(async()=>{try{const r=await deliverEmails(5);if(r.failed)console.error('Email delivery has retries pending',r.failed)}catch{console.error('Email delivery worker failed')}})}catch{/* Direct route-unit tests have no Next request lifecycle; explicit worker tests cover delivery. */}}
