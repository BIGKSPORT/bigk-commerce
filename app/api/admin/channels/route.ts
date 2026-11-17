import {z} from 'zod';
import {body,checkOrigin,failure,HttpError,rateLimitVisitor,requireAdmin} from '@/lib/security';
import {channelOverview,channelWrite,requireChannelsEnabled,writeChannel} from '@/lib/channel-service';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function GET(req:Request){try{await requireAdmin(req);requireChannelsEnabled();return Response.json(await channelOverview(),{headers});}catch(e){return failure(e);}}
export async function POST(req:Request){try{checkOrigin(req);await requireAdmin(req);requireChannelsEnabled();await rateLimitVisitor(req,'channel-stock-admin',60,60,1000);return Response.json(await writeChannel(channelWrite.parse(await body(req))),{headers});}catch(e){return failure(e instanceof z.ZodError?new HttpError(400,e.issues[0]?.message||'Controleer de koppeling.'):e);}}
