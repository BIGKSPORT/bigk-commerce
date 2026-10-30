import {expireReservations} from '../../lib/commerce';
import {closeDatabase} from '../../lib/db';
export default async function(){
 if(process.env.DATABASE_PROVIDER!=='postgres')throw new Error('Hosted jobs require PostgreSQL.');
 try{await expireReservations();return new Response(null,{status:204})}finally{await closeDatabase()}
}
export const config={schedule:'*/5 * * * *'};
