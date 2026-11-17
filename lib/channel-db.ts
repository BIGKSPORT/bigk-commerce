import {db} from './db';
import {databaseSchema,isPostgres} from './database';
import {db as sqlite} from './sqlite';
import {channelSchema} from './channel-schema';
let ready=false;
export function channelDb(){
 if(!isPostgres()&&!ready){sqlite().exec(channelSchema);ready=true;}
 return {prepare(text:string){return db().prepare(isPostgres()?text.replace(/\b(FROM|INTO|UPDATE|JOIN)\s+(channel_stock_policies|channel_variant_links)\b/g,'$1 '+databaseSchema()+'.$2'):text);}};
}
