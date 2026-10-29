import { closeDatabase } from '../lib/db';
import { expireReservations } from '../lib/commerce';
(await expireReservations());
console.log('Expired inventory reservations released.');

await closeDatabase();
