# One native mobile product gallery

Mobile photo navigation uses browser-native horizontal scrolling with CSS scroll snap. The existing track/images remain, with no custom touch thresholds or captured mobile pointers. Vertical page scrolling and pinch zoom remain native. The selected photo/meter follows scroll position; keyboard and thumbnails still use the same selection function. Resizing preserves the selected frame. Reduced motion uses immediate programmatic selection.

At widths up to 760px, tapping the inline photograph no longer opens a second full-screen gallery, and the extra expand toggle is hidden. Desktop hover/zoom/full-screen viewer remains available. The sticky larger photo and overlapping details sheet are unchanged.

No dependencies, services, tracking, database, stock, price, CSP or API changes. Revert this commit to restore previous mobile interaction. Browser tests cover native movement before release, settled selection, one inline mobile gallery, vertical scrolling from the photo, keyboard/reduced motion and existing desktop/mobile commerce flows. Physical iPhone/Safari feel should also be checked after release.
