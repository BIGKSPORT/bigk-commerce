// Read-only connectivity check; never prints keys or account data.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) throw new Error('Set the public Supabase URL and publishable key in .env.local.');
const target = new URL(url);
if (target.protocol !== 'https:' || !target.hostname.endsWith('.supabase.co') || target.username || target.password) {
  throw new Error('Expected an HTTPS Supabase project URL.');
}
try {
  const response = await fetch(new URL('/auth/v1/settings', target), {
    headers: { apikey: key }, signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Supabase returned HTTP ${response.status}.`);
  const settings = await response.json();
  if (typeof settings !== 'object' || settings === null || !('external' in settings)) {
    throw new Error('Unexpected Supabase Auth response.');
  }
  console.log('Supabase accepted the public key. Read-only Auth settings check passed.');
  console.log('This does not verify database policies, migrations, email delivery, or checkout.');
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Supabase connection check failed.');
  process.exitCode = 1;
}
