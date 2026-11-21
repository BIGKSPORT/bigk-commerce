import {salesSchema} from '../lib/sales-schema';
export function salesPostgresSchema(schema:'bigk'|'bigk_staging'){
 const role=schema==='bigk'?'bigk_server':'bigk_staging_server';
 const tables=['seller_accounts','seller_sessions','seller_customers','seller_orders','seller_events','seller_b2b_assignments','seller_prospects','seller_followups'];
 return 'BEGIN;\nSET LOCAL search_path TO '+schema+',pg_catalog;\n'+salesSchema+'\n'+tables.map(table=>`ALTER TABLE ${schema}.${table} ENABLE ROW LEVEL SECURITY;\nREVOKE ALL ON ${schema}.${table} FROM PUBLIC,anon,authenticated;\nGRANT SELECT,INSERT,UPDATE,DELETE ON ${schema}.${table} TO ${role};\nDROP POLICY IF EXISTS seller_server_access ON ${schema}.${table};\nCREATE POLICY seller_server_access ON ${schema}.${table} TO ${role} USING (true) WITH CHECK (true);`).join('\n')+'\nCOMMIT;\n';
}
