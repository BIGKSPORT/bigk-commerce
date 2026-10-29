# Product pages and image interactions

Reference: the user-supplied mobile screen recording, reviewed locally across its 38-second duration. It shows a full-width swipe gallery, thin progress marker, floating product actions, a compact product header, an assistant panel, details beneath the gallery and horizontal recommendations. The recording is not distributed with the source or website.

The Zalando product page at https://www.zalando.be/nike-sportswear-club-hoodie-hoodie-black-ni122s0sl-q11.html was also inspected through its public page and fetched HTML. Its gallery markup has thumbnail tabs and enlargement references. Live browser navigation to Zalando was unavailable in this execution environment, so its exact hover animation was not independently exercised. No Zalando branding, product data, images, reviews or service promises were copied.

## Implemented

- Primary catalogue image/title links open an actual /products/[slug] page. Explicit quick view remains available separately. The product route no longer renders the homepage with a product modal on top.
- Desktop catalogue photographs change as the mouse moves across them; arrow buttons and keyboard controls also navigate real supplied photos. Touch swipes change a card photo without opening the product accidentally.
- Desktop product pages use a large gallery, vertical thumbnail rail and purchase panel. Hovering/focusing thumbnails changes the main image. Arrows, Home/End and left/right keys navigate photos. Hover zoom follows the pointer; tapping/clicking opens an accessible full-screen viewer with zoom controls, arrows, keyboard navigation and Escape dismissal.
- Mobile product pages match the supplied flow: compact sticky title/actions header, full-width horizontal swipe gallery, thin progress strip, over-image save/bag/help buttons, product details below and a bottom shopping navigation bar. More-from-BigK cards scroll horizontally.
- Colour choices link only actual catalogue family records; duplicate same-SKU records are collapsed. All four VELVET colourways are shown. Switching products resets the selected size and gallery.
- Product help is a catalogue guide with colour, size, price and delivery answers, a reset action, colour links and compare/size shortcuts. It does not call a generative AI service, recognize uploaded images, send reminders or invent fabric/performance/fit claims. Those integrations remain separate work. No external AI cost is incurred.
- Save and bag actions use the existing browser persistence and stock/price safeguards. The bag shortcut scrolls to size selection. Unapproved prices remain pending; no arbitrary prices were invented to enable the demo.
- Reduced-motion settings disable gallery animations. Swiping preserves vertical scrolling, and thumbnail changes scroll only their own rail. Dialogs have accessible names.

Validation: strict TypeScript, production build, production HTTP product-route checks, plus isolated browser tests for image hover, true product navigation, four colours, thumbnail hover, keyboard controls, full-screen zoom, native touch swiping, the product-help panel, mobile overflow and the existing demo checkout flow. The demo remains owner-private and cannot charge or create production orders.

## Native scroll-over sheet

Full product pages now use a stacked CSS sticky gallery below an opaque white information panel. The panel scrolls in normal document flow; upward scrolling reverses the effect. The gallery is bounded by the product section and releases before recommendations. Quick views retain their original layout. Stable viewport units bound the gallery height, with separate mobile and desktop header offsets. Existing pan-y/pinch-zoom, keyboard and reduced-motion behavior is retained. No scroll listeners, scroll locking or nested information scrolling are used.

Browser geometry and hit-testing pass at 1440×1000, 390×844 and 844×390: image pinning, panel displacement/coverage, reverse scrolling, sticky release, header visibility and overflow. Existing gallery swipe, keyboard, fullscreen and demo commerce checks pass in the isolated preview fixture.
