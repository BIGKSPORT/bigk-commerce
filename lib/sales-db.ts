import {db} from './db';
import {databaseSchema,isPostgres} from './database';
import {db as sqlite} from './sqlite';
import {salesSchema} from './sales-schema';
let ready=false;
export function salesDb(){
 if(!isPostgres()&&!ready){sqlite().exec(salesSchema);ready=true;}
 return {prepare(text:string){return db().prepare(isPostgres()?text.replace(/\b(FROM|INTO|UPDATE|JOIN)\s+(seller_accounts|seller_sessions|seller_customers|seller_orders|seller_events|seller_b2b_assignments|seller_prospects|seller_followups|b2b_accounts|b2b_orders)\b/g,'$1 '+databaseSchema()+'.$2'):text);}};
}
