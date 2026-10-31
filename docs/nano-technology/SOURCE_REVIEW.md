# Nano technical rollout and accessible storefront preview — 31 October 2026

## Product identity and scope

Owner confirmed 25302901 = Nano Down Jacket (canonical P019, URL `nandown-jkt-p019`); 25303001 = Nano Down Gillet (P021, URL `nandown-fz-gillet-p021`). Existing legacy alias P020 remains an alias, not a third Nano product. Alpin Gillet 25303202 remains P007 and retains its separately reviewed fleece construction. No shared technology is inferred from names or broad SKU families. Prices, stock, EAN assignments, product URLs, images in the main gallery and publication flags are not changed by this rollout.

## Drive sources visually inspected

Jacket folder: 1KjzYsAvNOPrwNcZvk3_L6i8d_V9hQmLJ (63 direct files).
Gillet folder: 1ff7_QKRLTH3xY5pfgyBX6FG_v65YvRBa (80 direct files).
No care label was present in either complete folder listing. Internal Chinese images remain outside public assets.

| Article | Drive ID | Source / verified meaning |
|---|---|---|
| Jacket | 15RHbcjiJEGonGbCgfTOr9UrWnxgwcyjX | 参数(2).png: 25302901; white goose down; about 90% down-cluster content; outer fabric described as wind-resistant and splash-repellent; concealed zipped pockets; elastic cuff/hem binding; regular fit (合身); soft; no stretch on supplier scale. 0.4 kg has no reference size: omitted. |
| Jacket | 1p5RFZQlfENUIZbty38vV6vodYqf0owXh | 合格证(2).png: black 25302901, BIGK NAND DOWN, 160/80A; main fabric and lining 98% nylon (尼龙), 2% elastane (氨纶); contrast panels 100% polyester; white goose down, 90% down-cluster content. Fill mass 80g refers to this label size, not every variant: omitted from general specifications. Barcode 6957919564540 is not reassigned to any variant. |
| Jacket | 1wESt1nWYxb4Fy-M6SFRKxSPeemVwTwmm | 功能特点_01(3).png: 外层轻量防风面料 = lightweight wind-resistant outer fabric; 增加保暖性 = supports warmth. Original shell detail cropped below the logo/text and source WINDPROFF spelling. No unverified brand-name transcription, waterproof rating or performance number. |
| Jacket | 11-KTUhLymGdscECGMt77PKTOfLU9dppb | 功能特点_02(3).png: THERMAL; 内充白鹅绒 = filled with white goose down; 高绒子含量·持续保暖 = high down-cluster content, sustained warmth. This is down insulation, not the ALPIN inner fleece. |
| Jacket | 1d0-JGgabWIg76DnJtKcX9rCWh6GsfPwF | 功能特点_04(3).png: 弹力包边，不易脱丝·贴合身体 = elastic edge binding, resists loose threads, sits close to body. Actual cuff and hem photographs; no fabric-stretch inference. |
| Jacket | 1Nm_bVm7LKWRw7qraHZu-iO0qP_C8Omvt | 新尺码表(2).png: model 185 cm / 78 kg / XL. Numerical table differs from gillet and includes sleeve lengths; body vs garment convention is not unambiguous despite generic body-measurement footnote. Table and jin weight recommendations omitted, no automatic sizing. |
| Rejected cross-file | 1AxHVSJ-ALFTfcZuQSUmz0vWuy2kwkhss | 功能特点_04(2).png in JACKET folder actually depicts vest armholes/internal pocket. Not assigned to the jacket merely because of folder placement. |
| Gillet | 1YhT4vxZ8h0uN_75j4SRWUaW4lUGw8QnD | 参数.png: 25303001; independent white goose down / approximately 90% down-cluster statement; wind/splash resistant outer fabric; concealed zip and internal pockets; regular fit. Template mentions cuffs although garment is sleeveless: do not repeat cuff claim. 0.2 kg has no reference size: omitted. |
| Gillet | 1O-v2ffcVuXrla8S3vqui9YD0gmTQtCcG | 合格证.png: BIGK NAND DOWN VEST, black 25303001, 180/112A; main fabric/lining 98% nylon, 2% elastane; contrast panels 100% polyester; white goose down, 90% down-cluster content. Size-label fill mass 56g omitted from general claim. Barcode 6957919564724 retained internally, no EAN reassignment. |
| Gillet | 1d7j326UGgwMTESHDhmT0V7dv8dNRm0fk | 功能特点_02(2).png: own THERMAL / white goose down graphic and vest collar photograph. |
| Gillet | 15KoaoR-dAvQXH4CJyg83Tfzjxj9CfOQl | 功能特点_04(2).png: armhole/hem elastic binding, internal pocket (内置口袋，可容纳手机等多种物品 = internal pocket for phone and other items). Only vest-specific construction described. |
| Gillet | 12LZ-8rCrZsVGfpilty7jem9qYvLtjamO | 功能特点_03(2).png: 隐藏式拉链，减少衣服摩擦损坏 = concealed zip, reduces abrasion damage. Public wording describes concealed storage without inventing certified abrasion resistance. |
| Gillet | 10sR94eEF07GdtmbyDyU80D5CL7btSv1m | 头.png: NANO DOWN VEST, lightweight down vest, concealed zip, goose down, splash repellency. Model wears a separate white top; page explicitly excludes that top. |
| Gillet | 1qesOgJMvJRpJ3uykntRqzTRRnzTRIusK | 新尺码表.png: independently confirms model 185 cm / 78 kg / XL. Different chest/shoulder values from jacket, same ambiguity on measurement convention. No copied jacket/fleece size table or jin-as-kg error. |

## Customer-facing assets and claims

Seven English-named WebP detail images in `public/products/nano-technology/`. Deterministic source crops preserve actual garment pixels; Chinese headings, margins and watermark areas excluded. Source red annotation lines, where inside photographs, retained rather than fabricating garment texture. Gillet shell uses its existing approved clean flat-front gallery photograph. Existing THERMAL artwork is reused because it also appears in the Nano source; explanation explicitly concerns goose down, not fleece. LIGHTWEIGHT SHELL and BOUND EDGES are descriptive labels/icons, not invented certified technologies. No CHILL FLEX or THUMB LOOP assigned to Nano.

No universal garment/fill weight, fill power, recycled/certified/patented content, hydrostatic head, tested temperature or four-way stretch claim. 90% down-cluster content is not rewritten as a 90/10 down/feather blend. Precise care instructions await sewn-in labels.

## Viewing the storefront

On `bigk_staging` only, a valid existing admin session now allows the owner to see draft products at `/` and their existing `/products/...` URLs. Public visitors retain existing published-only visibility. `VERCEL_ENV=production` always denies draft-preview elevation even with the same session cookie. No new password, login bypass, publication flag change, or public preview token.

Private preview remains dynamic, noindex on staging, excludes product structured-data markup and disables purchasing. Normal storefront/cart behavior remains unchanged for published products and non-preview sessions. Archived variants and legacy aliases remain filtered. View storefront from the existing backoffice now leads to the populated private storefront using the same session.

## Verification

Passed Next build/type checking; 25 existing commerce tests; Nano identity/content isolation test; browser flow at 1440/390: actual admin login → storefront catalogue → both Nano pages and Alpin Gillet; expected 3/4/3 blocks; images decoded; no Chinese DOM/attributes; no horizontal overflow; private purchasing disabled. Anonymous draft access is 404. Separate LOCAL server with production marker and same session also returns 404 for drafts. Approved ALPIN fleece and Alpin Gillet browser regressions pass.

Final desktop/mobile screenshots visually reviewed. Original eleven Nano gallery photographs were additionally checked for embedded Chinese and remain unchanged. Local disposable-fixture cart check tests each Nano size selection, actual demo-bag contents and reload persistence; no hosted purchase or stock mutation.

No production deployment, customer emails, real payments or shipments. Await owner review before other-product rollout.
