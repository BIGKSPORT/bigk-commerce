/** Staging never sends to customer addresses by default. No recipient redirection. */
export function emailDeliveryAllowed(recipient:string){
 if(process.env.EMAIL_DELIVERY_ENABLED==='false')return false;
 const staging=process.env.VERCEL_ENV==='preview'||process.env.DATABASE_SCHEMA==='bigk_staging';
 if(!staging)return true;
 const testRecipient=process.env.EMAIL_TEST_RECIPIENT?.trim().toLowerCase();
 return process.env.EMAIL_DELIVERY_ENABLED==='true'&&!!testRecipient&&recipient.trim().toLowerCase()===testRecipient;
}
