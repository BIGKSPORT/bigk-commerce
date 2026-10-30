import {deliverEmails} from '../../lib/email';
import {closeDatabase} from '../../lib/db';
export default async function(){
 if(process.env.DATABASE_PROVIDER!=='postgres')throw new Error('Hosted jobs require PostgreSQL.');
 if(!process.env.RESEND_API_KEY||!process.env.EMAIL_FROM)return new Response(null,{status:204});
 try{const result=await deliverEmails(1);if(result.failed)throw new Error('Email delivery failed; retry is queued.');return new Response(null,{status:204})}finally{await closeDatabase()}
}
export const config={schedule:'* * * * *'};
