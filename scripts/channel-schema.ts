import {channelSchema} from '../lib/channel-schema';
export function channelPostgresSchema(schema:'bigk'|'bigk_staging'){
 const role=schema==='bigk'?'bigk_server':'bigk_staging_server';
 return 'BEGIN;\nSET LOCAL search_path TO '+schema+',pg_catalog;\n'+channelSchema+'\n'+['channel_stock_policies','channel_variant_links'].map(table=>`ALTER TABLE ${schema}.${table} ENABLE ROW LEVEL SECURITY;\nREVOKE ALL ON ${schema}.${table} FROM PUBLIC,anon,authenticated;\nGRANT SELECT,INSERT,UPDATE,DELETE ON ${schema}.${table} TO ${role};\nDROP POLICY IF EXISTS channel_server_access ON ${schema}.${table};\nCREATE POLICY channel_server_access ON ${schema}.${table} TO ${role} USING (true) WITH CHECK (true);`).join('\n')+'\nCOMMIT;\n';
}
