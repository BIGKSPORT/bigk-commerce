import {z} from 'zod';
import {authenticateWarehouse,createWarehouseSession,warehouseCookie} from '@/lib/warehouse-auth';
import {body,checkOrigin,failure,HttpError,rateLimitVisitor} from '@/lib/security';
export const runtime='nodejs';
export async function POST(req:Request){
 try{
  checkOrigin(req);
  await rateLimitVisitor(req,'warehouse-login',10,300,1000);
  const p=z.object({id:z.string().min(3).max(40),password:z.string().min(1).max(256)}).strict().safeParse(await body(req));
  if(!p.success)throw new HttpError(400,'Enter warehouse username and password.');
  const account=authenticateWarehouse(p.data.id,p.data.password);
  if(!account)throw new HttpError(401,'Warehouse credentials not recognised.');
  return Response.json({ok:true,name:account.name,role:account.role},{
   headers:{'Set-Cookie':warehouseCookie(await createWarehouseSession(account.id),7200),'Cache-Control':'no-store'},
  });
 }catch(e){return failure(e)}
}