# Product image optimization

The 50 selected source images total 219,978,154 bytes. Website derivatives total 26,744,830 bytes, a 87.8% reduction. Full framing and aspect ratio are retained; no cropping, stretching, recolouring or generated image replacements were used. Source masters are unchanged in Drive and preserved outside the application tree in the current workspace. Large original photos are intentionally excluded from the deployed public/ directory.

Five supplied PNGs use lossless WebP at their original dimensions. Every decoded RGB pixel was compared with the oriented sRGB reference; all five matched exactly. JPEG sources are resized only when their long edge exceeds 2400px, then encoded as WebP at quality 94 with smart subsampling. These are high-quality web derivatives, not mathematically lossless or full-resolution archival replacements. Sampled PSNR ranged from 39.49 dB upward; that metric does not replace visual review.

`PRODUCT_IMAGE_WEB_ASSETS.json` records each original path/hash/size, derivative path/hash/size, dimensions, encoder setting and sampled PSNR. `PRODUCT_IMAGE_SOURCES.json` links the original Drive files to current website paths. Original SHA-256 entries refer to the Drive source, while webSHA256 refers to the derivative.

To rebuild derivatives after materializing your chosen source files under a local masters directory (products/drive/original-filename):

```sh
PRODUCT_MASTERS_DIR=/absolute/path/to/masters npm run images:optimize
```

The normal app build uses existing web assets; it does not require masters or Drive access. Next.js also serves responsive AVIF/WebP versions sized for each screen. The private static preview serves these prebuilt WebP assets directly.

Replacing or deleting a Drive file does not automatically update the website. Update the catalogue mappings, regenerate the affected web assets, review the previews, sync only inactive/unapproved records in staging, and rebuild/redeploy. The current production admin supports product pricing, stock and activation, but not direct image upload/removal.
