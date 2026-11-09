# Higher and larger mobile product photos

Preserve the existing overlapping information sheet. Only the mobile space above the photo and photo height change.

At widths up to 760px the gallery uses min(150vw, 100svh - 72px). Sticky positioning, parent containment, rounded sheet, negative overlap, gallery actions and native scrolling remain intact. Desktop sizing is unchanged.

The Alpin mobile header becomes one 60px row with back link, product title, existing language selector and bag. Its desktop brand and language links remain. The sticky gallery follows the 60px header.

No database/API changes, dependencies, tracking, services or additional queries. Photos, prices and stock are unchanged. Revert this commit to restore previous dimensions. Browser assertions check the larger frame, higher start, sticky positioning and existing 18px overlap.
