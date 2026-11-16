import {writeFileSync,mkdirSync} from 'node:fs';
import {salesPostgresSchema} from './sales-schema';
mkdirSync('supabase/sales',{recursive:true});
for(const schema of ['bigk','bigk_staging'] as const)writeFileSync('supabase/sales/'+schema+'.sql',salesPostgresSchema(schema));
console.log('Prepared additive seller tables with RLS and server-only grants. No database was changed.');
