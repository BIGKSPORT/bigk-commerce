import {db} from './db';
import {databaseSchema,isPostgres} from './database';
import {db as sqlite} from './sqlite';
import {operationsSchema} from './operations-schema';
let localSchemaReady=false;
/** Qualify only the seven new private tables. Existing SQL/transactions are untouched. */
export function operationsSQL(text:string){
 if(!isPostgres())return text;
 return text.replace(/\b(FROM|INTO|UPDATE|JOIN)\s+(shop_features|staff_accounts|staff_sessions|operations_audit|customer_messages|invoice_counters|order_invoices)\b/g,'$1 '+databaseSchema()+'.$2');
}
export function operationsDb(){
 // Local test/development compatibility only. Serverless PostgreSQL uses the migration.
 if(!isPostgres()&&!localSchemaReady){sqlite().exec(operationsSchema);localSchemaReady=true;}
 return {prepare(text:string){return db().prepare(operationsSQL(text));}};
}
