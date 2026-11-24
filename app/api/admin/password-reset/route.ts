import {z} from 'zod';
import {requestPasswordReset,resetAdminPassword} from '@/lib/admin-mfa';
import {body,checkOrigin,failure,HttpError,rateLimitVisitor} from '@/lib/security';

export const runtime = 'nodejs';

const schema = z.discriminatedUnion('action', [
  z.object({action: z.literal('request')}).strict(),
  z.object({
    action: z.literal('finish'),
    token: z.string().min(32).max(128),
    password: z.string().min(16).max(256),
    code: z.string().min(1).max(100),
  }).strict(),
]);

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const input = schema.safeParse(await body(request));
    if (!input.success) throw new HttpError(400, 'Controleer de herstelgegevens.');
    if (input.data.action === 'request') {
      await rateLimitVisitor(request, 'admin-password-reset-email', 2, 900, 4);
      await requestPasswordReset();
    } else {
      await rateLimitVisitor(request, 'admin-password-reset-finish', 8, 900, 60);
      await resetAdminPassword(input.data);
    }
    return Response.json({ok: true}, {headers: {'Cache-Control': 'no-store'}});
  } catch (error) {
    return failure(error);
  }
}
