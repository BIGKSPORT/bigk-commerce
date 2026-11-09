import {z} from 'zod';
import {boundedText,checkOrigin,failure,HttpError,requireAdmin,rateLimit} from '@/lib/security';
import {merchandisingState,writeMerchandising} from '@/lib/merchandising';
import {merchandisingSchema} from '@/lib/merchandising-content';
const schema=z.discriminatedUnion('action',[
 z.object({action:z.literal('save'),version:z.number().int().min(0),draft:merchandisingSchema}).strict(),
 z.object({action:z.enum(['publish','disable']),version:z.number().int().min(0)}).strict(),
]);
export const runtime='nodejs';
export async function GET(req:Request){try{await requireAdmin(req);return Response.json(await merchandisingState(),{headers:{'Cache-Control':'no-store'}});}catch(e){return failure(e);}}
export async function POST(req:Request){try{checkOrigin(req);await requireAdmin(req);await rateLimit('admin-storefront',90,300);const input=schema.safeParse(JSON.parse(await boundedText(req,80000)));if(!input.success)throw new HttpError(400,input.error.issues[0]?.message||'Check the campaign fields.');return Response.json(await writeMerchandising(input.data.action,input.data.version,'draft' in input.data?input.data.draft:undefined),{headers:{'Cache-Control':'no-store'}});}catch(e){if(e instanceof SyntaxError)return failure(new HttpError(400,'Invalid JSON.'));return failure(e);}}
