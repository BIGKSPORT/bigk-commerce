import {z} from 'zod';
import {importOperationSchema} from '@/lib/catalog-import-schema';
import {applyProductBatch} from '@/lib/catalog-files';
import {boundedText,checkOrigin,failure,HttpError,requireAdmin} from '@/lib/security';
export const runtime='nodejs';
export async function POST(req:Request){try{checkOrigin(req);await requireAdmin(req);const data=z.object({operations:z.array(importOperationSchema).min(1).max(100),dryRun:z.boolean().default(true)}).strict().safeParse(JSON.parse(await boundedText(req,2097152)));if(!data.success)throw new HttpError(400,'Invalid batch: '+data.error.issues[0].message);return Response.json(await applyProductBatch(data.data.operations,data.data.dryRun),{headers:{'Cache-Control':'no-store'}})}catch(e){return failure(e)}}
