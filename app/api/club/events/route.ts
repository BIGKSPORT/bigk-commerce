import {z} from 'zod';
import {customerEmail} from '@/lib/club';
import {bookEvent} from '@/lib/club-events';
import {body,checkOrigin,failure,HttpError,rateLimit} from '@/lib/security';
export async function POST(req:Request){try{checkOrigin(req);const email=await customerEmail(req);await rateLimit('club-events:'+email,20,60);const d=z.object({id:z.string().max(100),quantity:z.number().int().min(1).max(20),action:z.enum(['register','waitlist','cancel'])}).strict().safeParse(await body(req));if(!d.success)throw new HttpError(400,'Check the event and ticket quantity.');return Response.json(await bookEvent(d.data.id,email,d.data.quantity,d.data.action),{headers:{'Cache-Control':'no-store'}})}catch(e){return failure(e)}}
