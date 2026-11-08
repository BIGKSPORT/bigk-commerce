import {z} from 'zod';
import {db} from '@/lib/db';
import {body,checkOrigin,failure,HttpError,requireAdmin} from '@/lib/security';
import {featureNames,setFeature,shopFeatures} from '@/lib/shop-features';
import {changeStaff,inviteSchema,inviteStaff,staffList} from '@/lib/staff-access';
export const runtime='nodejs';
export async function GET(req:Request){try{await requireAdmin(req);const [features,staff,audit]=await Promise.all([shopFeatures(),staffList(),db().prepare('SELECT id,actor_name,action,entity,details,created_at FROM operations_audit ORDER BY created_at DESC LIMIT 100').all()]);return Response.json({features,staff,audit},{headers:{'Cache-Control':'no-store'}});}catch(e){return failure(e);}}
const write=z.discriminatedUnion('action',[
 z.object({action:z.literal('feature'),name:z.enum(featureNames),enabled:z.boolean()}).strict(),
 z.object({action:z.literal('invite'),staff:inviteSchema}).strict(),
 z.object({action:z.enum(['disable','reset']),id:z.uuid()}).strict(),
]);
export async function POST(req:Request){try{checkOrigin(req);await requireAdmin(req);const p=write.safeParse(await body(req));if(!p.success)throw new HttpError(400,'Check the operation details.');const d=p.data;if(d.action==='feature'){await setFeature(d.name,d.enabled);return Response.json({ok:true});}if(d.action==='invite')return Response.json(await inviteStaff(d.staff));return Response.json(await changeStaff(d.id,d.action));}catch(e){return failure(e);}}
