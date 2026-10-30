import {z} from 'zod';
import {requireAdmin,checkOrigin,body,failure,HttpError} from '@/lib/security';
import {runTestShipment,testGuard,testStatus} from '@/lib/myparcel-test';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const schema=z.object({confirmTestShipment:z.literal('CREATE_UNUSED_TEST_LABEL')}).strict();
export async function GET(req:Request){try{await requireAdmin(req);testGuard();return Response.json(await testStatus(),{headers:{'Cache-Control':'no-store'}});}catch(e){return failure(e);}}
export async function POST(req:Request){try{
 checkOrigin(req);await requireAdmin(req);testGuard();
 if(!schema.safeParse(await body(req)).success)throw new HttpError(400,'Bevestiging voor een testlabel vereist.');
 const result=await runTestShipment();
 return Response.json(result,{status:result.created?200:502,headers:{'Cache-Control':'no-store'}});
}catch(e){return failure(e);}}
