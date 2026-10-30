import {processClub} from '../lib/club';
import {closeDatabase} from '../lib/db';
try{console.log(await processClub())}finally{await closeDatabase()}
