import {clubConfig} from '@/lib/club';
export const dynamic='force-dynamic';
export async function GET(){const config=clubConfig();return Response.json({enabled:config.enabled,waitDays:config.waitDays},{headers:{'Cache-Control':'no-store'}})}
