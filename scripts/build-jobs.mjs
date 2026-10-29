import { build } from 'esbuild';
await build({entryPoints:['scripts/expire-reservations.ts','scripts/deliver-emails.ts'],outdir:'.next/jobs',bundle:true,external:['postgres'],platform:'node',target:'node24',format:'esm',outExtension:{'.js':'.mjs'}});
