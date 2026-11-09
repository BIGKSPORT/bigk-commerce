# Smooth product-photo gestures

The main product gallery now follows touch/pen movement directly, with no CSS transition while dragging. Release settles using the existing transform carousel with a short ease-out transition. Gentle drags use a width-aware 18–32px threshold, and short quick flicks can advance from 12px. Direction locking separates horizontal photo gestures from vertical native page scrolling; no preventDefault, scroll interception or touch-action restriction was added. Cancel/lost capture restores the active frame. Taps still open the viewer, and desktop hover, keyboard, thumbnail and arrow navigation remain.

The existing sticky gallery, overlapping information panel and larger mobile frame remain unchanged. Reduced motion still disables settling animation. No dependency, service, tracking, database, photo, stock, price, CSP or API changes. Revert this commit to restore previous gesture behavior.

Browser checks exercise real Chromium touch input: photo movement before release, a gentle 30px swipe, cancellation, vertical scrolling from the photo, tap-to-enlarge, reduced motion, and existing desktop/mobile commerce flows. Physical iPhone/Safari feel should also be checked by the owner after release.
