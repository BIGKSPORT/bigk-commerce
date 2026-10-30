import {z} from 'zod';
import {clubSummary,customerEmail,joinClub,requireClub} from '@/lib/club';
import {eventCards} from '@/lib/club-events';
import {body,checkOrigin,failure,HttpError,rateLimit} from '@/lib/security';
export async function GET(req:Request){try{requireClub();const email=await customerEmail(req);return Response.json({club:await clubSummary(email),events:await eventCards(email)},{headers:{'Cache-Control':'no-store'}})}catch(e){return failure(e)}}
export async function POST(req:Request){try{checkOrigin(req);requireClub();const email=await customerEmail(req);await rateLimit('club-join:'+email,5,60);const data=z.object({name:z.string().trim().min(1).max(100),consent:z.literal(true)}).strict().safeParse(await body(req));if(!data.success)throw new HttpError(400,'Provide your name and accept the Club rules.');return Response.json({club:await joinClub(email,data.data.name)},{headers:{'Cache-Control':'no-store'}})}catch(e){return failure(e)}}
