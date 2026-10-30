import {processClub} from '../../lib/club';
import {closeDatabase} from '../../lib/db';
export default async function(){
 if(process.env.DATABASE_PROVIDER!=='postgres')throw new Error('Hosted jobs require PostgreSQL.');
 if(process.env.BIGK_CLUB_ENABLED!=='true')return new Response(null,{status:204});
 try{await processClub();return new Response(null,{status:204})}finally{await closeDatabase()}
}
export const config={schedule:'17 * * * *'};
