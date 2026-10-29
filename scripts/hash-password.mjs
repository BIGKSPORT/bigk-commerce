import { randomBytes, scryptSync } from 'node:crypto';
import { createInterface } from 'node:readline';
import { Writable } from 'node:stream';
const output=new Writable({write(_chunk,_enc,cb){cb()}});
process.stdout.write('Choose a unique admin password (input hidden): ');
const rl=createInterface({input:process.stdin,output,terminal:true});
rl.question('',password=>{rl.close();if(password.length<16){console.error('\nUse at least 16 characters.');process.exit(1)}const salt=randomBytes(16).toString('hex');console.log('\nADMIN_PASSWORD_HASH='+salt+':'+scryptSync(password,salt,64).toString('hex'))});
