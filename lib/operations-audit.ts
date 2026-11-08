import {db,audit} from './db';
export type OperationActor={id:string;name:string;role:'owner'|'stock_manager'|'warehouse_manager'};
export const ownerActor:OperationActor={id:'owner',name:'Store owner',role:'owner'};
export async function operationAudit(actor:OperationActor,action:string,entity:string,details:unknown){
 await db().prepare('INSERT INTO operations_audit(id,actor_id,actor_name,action,entity,details,created_at) VALUES(?,?,?,?,?,?,?)').run(crypto.randomUUID(),actor.id,actor.name,action,entity,JSON.stringify(details),new Date().toISOString());
 await audit(action,entity);
}
