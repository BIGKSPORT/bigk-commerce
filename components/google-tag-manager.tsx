import Script from 'next/script';

/** Container ID from Google Tag Manager. Override with NEXT_PUBLIC_GTM_ID if needed. */
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || 'GTM-5PVPXWVG';

/** Head + body snippets for GTM. Only load on the real storefront, not when ID is empty. */
export function GoogleTagManager() {
  if (!GTM_ID || process.env.DATABASE_SCHEMA === 'bigk_staging') return null;

  return (
    <>
      <Script id="gtm-loader" strategy="afterInteractive">{`
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');
`}</Script>
    </>
  );
}

export function GoogleTagManagerNoscript() {
  if (!GTM_ID || process.env.DATABASE_SCHEMA === 'bigk_staging') return null;
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
