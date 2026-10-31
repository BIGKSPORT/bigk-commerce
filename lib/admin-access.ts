import {db} from './db';
import {databaseSchema,isPostgres} from './database';
export function developmentAccess(){return !isPostgres()||databaseSchema()==='bigk_staging'}
export async function adminPasswordHash(){if(developmentAccess()){const row=await db().prepare('SELECT password_hash FROM admin_credentials WHERE id=?').get('admin');if(row)return String(row.password_hash)}return process.env.ADMIN_PASSWORD_HASH||''}
