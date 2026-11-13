import type { NextConfig } from 'next';

const gtmScript =
  " https://www.googletagmanager.com https://www.google-analytics.com https://www.google.com https://tagmanager.google.com";
const gtmConnect =
  " https://www.googletagmanager.com https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://region1.analytics.google.com https://stats.g.doubleclick.net https://www.google.com";
const gtmImg =
  " https://www.googletagmanager.com https://www.google-analytics.com https://www.google.com https://www.google.be https://stats.g.doubleclick.net data:";
const gtmFrame = " https://www.googletagmanager.com";

const config: NextConfig = {
  poweredByHeader: false,
  output: 'standalone',
  images: { formats: ['image/avif', 'image/webp'], qualities: [75, 85] },
  serverExternalPackages: ['node:sqlite', 'postgres'],
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.bigk.be' }],
        destination: 'https://bigk.be/:path*',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}${gtmScript}`,
              "style-src 'self' 'unsafe-inline'",
              `img-src 'self'${gtmImg}`,
              "font-src 'self'",
              `connect-src 'self'${gtmConnect}`,
              `frame-src 'self'${gtmFrame}`,
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self' https://checkout.stripe.com",
            ].join('; '),
          },
        ],
      },
    ];
  },
};
export default config;
