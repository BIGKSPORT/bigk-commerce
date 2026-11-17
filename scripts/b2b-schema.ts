import {b2bSchema} from '../lib/b2b-schema';
export function b2bPostgresSchema(schema:'bigk'|'bigk_staging'){
 const role=schema==='bigk'?'bigk_server':'bigk_staging_server';
 const tables=['b2b_accounts','b2b_links','b2b_sessions','b2b_orders','b2b_events'];
 return 'BEGIN;\nSET LOCAL search_path TO '+schema+',pg_catalog;\n'+b2bSchema+'\n'+tables.map(table=>`ALTER TABLE ${schema}.${table} ENABLE ROW LEVEL SECURITY;\nREVOKE ALL ON ${schema}.${table} FROM PUBLIC,anon,authenticated;\nGRANT SELECT,INSERT,UPDATE,DELETE ON ${schema}.${table} TO ${role};\nDROP POLICY IF EXISTS b2b_server_access ON ${schema}.${table};\nCREATE POLICY b2b_server_access ON ${schema}.${table} TO ${role} USING (true) WITH CHECK (true);`).join('\n')+'\nCOMMIT;\n';
}
