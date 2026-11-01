import {importB10Draft} from '../../lib/b10-import';import {closeDatabase} from '../../lib/db';
if(process.env.DATABASE_PROVIDER!=='sqlite'||!process.env.DATABASE_PATH?.includes('bigk-b10-browser-'))throw Error('Disposable B10 fixture only.');
await importB10Draft();await closeDatabase();
