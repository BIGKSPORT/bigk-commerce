import {cleanSavedCarts} from '@/lib/cart-sessions';
import {cleanupNewsletterRequests} from '@/lib/newsletter';
import {z} from 'zod';import {requireJob,sendOrderPreview} from '@/lib/email-operations';import {deliverEmails} from '@/lib/email';import {expireReservations} from '@/lib/commerce';import {body,failure,HttpError,rateLimit} from '@/lib/security';
export const runtime='nodejs';export const maxDuration=60;export const dynamic='force-dynamic';
export async function GET(req:Request){try{requireJob(req);await expireReservations();await cleanupNewsletterRequests();try{await cleanSavedCarts()}catch{console.error('Saved cart cleanup unavailable')}return Response.json(await deliverEmails(5),{headers:{'Cache-Control':'no-store'}})}catch(e){return failure(e)}}
export async function POST(req:Request){try{requireJob(req);await rateLimit('owner-email-preview',4,3600);const p=z.object({kind:z.enum(['confirmation','shipment'])}).strict().safeParse(await body(req));if(!p.success)throw new HttpError(400,'Choose a confirmation or shipment test.');return Response.json(await sendOrderPreview(p.data.kind))}catch(e){return failure(e)}}
