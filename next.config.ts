import type { NextConfig } from 'next';
const config: NextConfig = {
  poweredByHeader: false,
  output: 'standalone',
  images: {formats:['image/avif','image/webp'],qualities:[75,85]},
  serverExternalPackages: ['node:sqlite','postgres'],
  async redirects() { return [{source:'/:path*',has:[{type:'host',value:'www.bigk.be'}],destination:'https://bigk.be/:path*',permanent:true}]; },
  async headers() { return [{ source: '/:path*', headers: [
    {key:'Strict-Transport-Security',value:'max-age=63072000'},
    {key:'X-Content-Type-Options',value:'nosniff'},
    {key:'X-Frame-Options',value:'DENY'},
    {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
    {key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=()'},
    {key:'Content-Security-Policy',value:`default-src 'self'; script-src 'self' 'unsafe-inline'${process.env.NODE_ENV==='development'?" 'unsafe-eval'":''}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://checkout.stripe.com`}
  ]}]; }
};
export default config;
