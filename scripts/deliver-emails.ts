import { deliverEmails } from '../lib/email';
const result=await deliverEmails();
console.log(JSON.stringify(result));
if(result.failed)process.exitCode=1;
