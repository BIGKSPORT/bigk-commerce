# BigK interactive preview

URL: https://bigk-commerce-preview.grandbead9.chatgpt.site

Owner-private publication on Sites, separate from the production commerce application and the GoDaddy domains. Includes the approved visual identity, updated catalogue snapshot, all four Velvet colourways, Nano Down Vest front/back/detail gallery, and optimized web images.

Working demo interactions: search/category/size/photo filters, sorting, saved items, comparison, product galleries, bag size/quantity/removal, local demo checkout and receipt. Only products with existing illustrative prices can enter the demo bag. Products with unapproved/missing prices remain visible with price pending.

Payments, real shipments, server inventory holds, Supabase runtime access, account login and admin changes are unavailable in this demo. Checkout is prefilled with fictional sample details. Its form values are discarded, not sent to a server; only the latest receipt summary is stored in browser session storage. The static demo intercepts its own /api/catalog, /api/checkout and /api/orders calls locally. This adapter exists only in preview/ and is never imported by the production Next.js routes.

Build with `PREVIEW_OUTPUT=/absolute/path/to/dist npm run preview:build`. Run `PREVIEW_OUTPUT=/absolute/path/to/dist npm run test:preview` with an installed Chromium executable (CHROMIUM_PATH may be set). The isolated browser test supplies storage, asset embedding, navigation and a randomUUID fallback for its about:blank test origin; the deployed HTTPS site uses native browser APIs. It does not constitute live-provider end-to-end testing.

Publication source is the dedicated Sites repository. Production source and the preview build source remain reviewable in GitHub PR #1. Future catalogue changes require rebuilding and republishing this fixed demo snapshot. Original Drive changes do not automatically synchronize.
