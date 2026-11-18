import {unstable_cache} from 'next/cache';
import {databaseSchema} from '@/lib/database';
import {readAdminLive} from '@/lib/admin-live';
import {failure,requireAdmin} from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const cachedOverview = unstable_cache(
  async (_environment: string) => readAdminLive(), ['admin-live-v1'], {revalidate:20},
);

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const headers = {'Cache-Control':'private, no-store'};
    if (process.env.NEXT_PUBLIC_ADMIN_LIVE_VIEW_ENABLED !== 'true')
      return Response.json({error:'Live view is disabled.'},{status:404,headers});
    const environment = [process.env.VERCEL_ENV, process.env.VERCEL_GIT_COMMIT_SHA, databaseSchema()].join(':');
    return Response.json(await cachedOverview(environment), {headers});
  } catch (error) {
    return failure(error);
  }
}
