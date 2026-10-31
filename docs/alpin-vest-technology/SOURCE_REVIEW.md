# ALPIN VEST PRO source review — 31 October 2026

## Scope and mapping

Pilot: existing P007 (`alpine-gillet-p007`), code `Alpine Gillet 25303202`, staging name `Alpin Vest Pro`, description `cream-black Gillet`, price 13390 cents, version 1. Four existing gallery photographs match the supplied cream/beige-black sleeveless stand-collar vest with red chest zip, black contrast panels and separate blue base layer. Preserve all catalogue records, prices, stock, variants, EANs, URLs and publication flags. Read-only staging inspection only; no hosted writes.

Do not attach to P006 / 25303201 (black entry has no verified gallery), hooded 253017 family, ALPIN fleece or a separate Gilet folder. `hasAlpinVestTechnology` requires explicit P007 + 25303202; names and family prefixes cannot assign claims.

Unresolved historical issue: `docs/ORDER_CATALOGUE_NAME_RECONCILIATION.md` records a physical 25303202 label as Dusty Blue, whereas the CURRENT staging description is cream-black and its gallery matches the new vest technical images. Owner was asked to confirm the article-to-colour association; the existing relationship has not been changed or represented as label-verified. Technical presentation is bound to the currently matched listing, not a newly asserted GTIN allocation. Obtain correct physical article label before reconciling colours or barcodes.

## Original Drive evidence

Folder: https://drive.google.com/drive/folders/1N18lEpgfWM06CvKxnf305VocHgxEQXHg

Complete fetched listing has original JPEG product shoot, five main PNG graphics, introduction and three feature graphics, no child folder, specifications card, composition/product label, size chart or care footer. The folder name is Alpin Vest Pro; introduction says ALPIN VEST. Existing storefront name is retained.

| Drive ID | Original | Read directly from image |
|---|---|---|
| 1fHugPba9GInv-zYZSz5l4xVWShoFzZ0D | 功能特点_01(1).png | CHILL FLEX; 拉毛外层 = brushed outer layer; actual beige fleece macro photograph. |
| 1mrIfQMxrlJYyY61mB15Y-rrADvtMDY-B | 功能特点_02(1).png | THERMAL; 内层绒毛 = inner fleece; 密集锁温・高效保暖 = dense warmth retention / effective warmth. No numerical insulation claim. Actual beige inner surface photo. |
| 17zvE9dFnoqjY_tzctXp0n0-Ox21E39EB | 功能特点_03(1).png | 多个拉链口袋，可容纳多种物品 = multiple zipped pockets for various belongings. Split detail photographs show chest and lower pocket zips. Full vest front photographs confirm one chest + two lower front pockets. |
| 1lli8-XESjB8ogUVimsRHbTrBXegK_xvV | 头(1).png | ALPIN VEST; 休闲高领马甲 = casual stand-collar vest; 拉链口袋 = zipped pockets; 保暖面料 = warmth-focused fabric. Front/back actual sleeveless vest, stand collar, full front zip, beige/black and black colour references. Blue long-sleeve top is visibly separate. |
| 1ctcbbOsK1fK1GXueSXnnsb55hzDU_VCT | 主图.png | Main promotional image downloaded as additional internal reference. Not used publicly. |

Three public WebP assets are deterministic crops of the three technical photographs; crop rectangles (after viewing at original width 750): outer x80/y300/w590/h630; inner x80/y300/w585/h615; pocket x85/y295/w575/h625. Chinese headers, borders and promotional text are outside every crop. No synthetic pixels, recolouring, retouching or altered fabric.

CHILL FLEX and THERMAL artwork is visually identical to approved fleece branding. Reuse existing PNGs directly, retaining the white CHILL / red FLEX / white graphic against dark backing. No copied turquoise photos and no new logo reconstruction. SECURE POCKETS is the existing descriptive icon/label, not a proprietary technology claim. No THUMB LOOP block, cuff or sleeve construction claims.

Layering uses existing verified gallery image `alpin-vest-pro-bigk-alpin-vest00001.webp`, originating from `BigK Alpin Vest00001.jpg` (Drive 1itPLeY48S0BazcrLzMF1mqLVeGw0d5Fb), with alt text and customer copy explicitly excluding the separate blue top.

## Missing evidence, without invented substitutes

- Vest composition label / manufacturer spec: older database copy says 100% polyester but these vest originals do not establish it. This unsupported assertion is not repeated in the new rendered vest copy. No database value was rewritten.
- Stretch, weight and fit classification: not established; omitted.
- Vest-specific size chart and verified model height/weight/worn size: absent; show available variant labels only, no fleece table, jin conversion or automatic size recommendation.
- Current sewn-in care label: absent; no temperature/bleach/tumble/iron claims, only follow the garment's label.
- Physical article label for current cream-black vest: needed to resolve historical Dusty Blue discrepancy before changing any product/variant identifiers.

## Implementation and checks

Reuse approved `TechnologyBadges`, `TechnologyBlocks`, typography and scoped CSS. Three cards have a full-width final desktop row and single-column mobile flow. New layout class applies only to exactly three features. Vest content in a separate configuration and component. ALPIN fleece content/config/assets remain intact.

Passed: Next production build/type checking; 25 existing commerce tests; vest isolation unit test; vest browser at 1440/390px (three blocks/no empty card, images decoded, no Chinese DOM/attributes, no copied fleece specifications, base layer exclusion, responsive width, actual selected P007 variant added to bag and persisted after reload); approved fleece tests at both widths. Before/after fleece screenshots are pixel-identical at both widths. Final desktop/mobile vest screenshots visually reviewed for Chinese pixels and source-image accuracy.

Local browser fixtures use disposable SQLite databases and demo cart. No hosted inventory changes, payments, customer messages, fulfilment or production deployment. Existing private product preview workflow is used for owner review.
