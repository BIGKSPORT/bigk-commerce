import {db} from './db';
import {databaseSchema,isPostgres} from './database';
import {db as sqlite} from './sqlite';
import {b2bSchema} from './b2b-schema';
let ready=false;
export function b2bDb(){
 if(!isPostgres()&&!ready){sqlite().exec(b2bSchema);ready=true;}
 return {prepare(text:string){return db().prepare(isPostgres()?text.replace(/\b(FROM|INTO|UPDATE|JOIN)\s+(b2b_accounts|b2b_links|b2b_sessions|b2b_orders|b2b_events)\b/g,'$1 '+databaseSchema()+'.$2'):text);}};
}
