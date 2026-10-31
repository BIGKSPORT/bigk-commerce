# ALPIN technology pilot — source review, 31 October 2026

Scope: P001 / 25303101 and P002 / 25303102 only. Existing ALPIN name, URLs, galleries, prices, variants, EANs, inventory and approvals retained. No hosted catalogue writes. Shared presentation components do not infer technologies from names or family prefixes. Unfinished CRM work is preserved in the separate original worktree.

## Verified original sources

All visually read in Products → Alpin fleece pro, folder 106AbX8Ci9zJlJ-8UUHI1_MF7103-F7Ln. The folder listing contains 72 files, no child folders or original vector artwork. CHILL keyword search found no additional artwork. Do not treat the existing AI-generated transparent logo as an original.

| Drive file ID | Original | Actual contents and decision |
|---|---|---|
| 1vUvCgJqgMqAGUXi_IJfy1YAp9PHQa1PM | 功能特点_01.png | CHILL FLEX artwork; 拉毛外层 = brushed outer layer. Original macro photo and logo crop used. |
| 1kyzLCMIdK8VqrLslJjusSsZrw6e9HgrE | 功能特点_02.png | THERMAL artwork; 内层绒毛 = inner fleece; 密集锁温、高效保暖 = dense warmth retention, warmth. No measured performance inferred. |
| 1UjWI7ZcR5KeAvrBG5TA29mOrPQtWiZlv | 功能特点_03.png | 多个拉链口袋，可容纳多种物品 = multiple zipped pockets for various belongings. Detail plus full product photography confirms one chest and two front pockets. |
| 1ab7ipD8vUb2Oi6WXXAR-GqLnUGI7Mgg7 | 功能特点_04.png | 拇指叉设计，增加灵活性 = thumb opening design, increases flexibility of movement. Describes cuff function, not stretch fabric. Cropped original photo retains original red pointing line; no fabricated pixels. |
| 1_Eubi8jLrjnN6xB-K2fyR5ZURZHm4rJ1 | 参数.png | 25303101/02, KNOK range; warmth-focused composite fabric, soft inner fleece, brushed outer, everyday city wear/outdoor walks. Marked relatively thick, soft, no elasticity (无弹), roomy (宽松). Weight 0.7 kg has no reference size: omitted. |
| 1iyACA7oGDceVnZV6WVrkED8aOmbXZ8lB | 合格证.png | ALPIN, black (黑色), 25303101, L; main fabric (主面料) 100% polyester, China/Shanghai. Barcode 6957919564779. No certification claim copied from standards printed on hangtag. |
| 14mGx60A2NjV78228J-DoBPFPOj99k1my | 颜色展示.jpg | Black 25303101; 雾青色 25303102 = mist blue/green. Owner authorised source-based correction: display Mist Blue for ALPIN 25303102. Underlying IDs/EANs unchanged. |
| 1rLbVYw1Y5N55GF64OVOpWE0i1gA9YA7F | 头.png | ALPIN, casual stand-collar jacket, zipped pockets/warmth fabric. Both colours visually match existing gallery construction, zip/panel/patch positions. |
| 1aY2GrQyOuUCNnZ6cJeR1_2VxMoSUqk0w | 新尺码表.png | Footnote explicitly says sizes measured from body dimensions (产品的尺码根据身体测量而定). Shoulder width and chest circumference are displayed as supplier BODY measurements, not garment measurements. XS–3XL: shoulder 39/41.5/44/46.5/49/51.5/54 cm; chest 94/100/106/112/118/124/130 cm. Model 185 cm, 78 kg, XL. Weight recommendations in 斤 (jin) omitted, no automatic fit algorithm. XS shown in supplier chart does not create a sellable XS variant. |
| 1OW9L7pTPEXl8GIMsrSk61ORfh04qCw_c | 尾巴.jpg | Generic store footer: cold gentle wash/air dry/no harsh sun; icons/text 30°C, inside-out, separate colours, ≤30 minutes, no bleach, no dry-clean. Iron text says medium while numeric maximum 110°C and symbol is inconsistent. No sewn label supplied. Therefore no product-specific temperatures/ironing published. Retail shipping/returns/promotional terms omitted. |

## Public assets and logo limitation

`public/products/alpin-technology/`: seven small files, original image crops only; English filenames and alt text. No Chinese pixels included. The four detail photos show the Mist Blue colourway, identified in the page caption even on Black. Model photograph is also source photography, cropped cleanly. Original main galleries unchanged.

CHILL FLEX PNG uses isolated original angular lettering, original white underlining graphic and red FLEX, with transparent black background. No substitute font, AI reconstruction, effects or embedded-raster SVG. No original vector found in the ALPIN folder; original SVG/AI/EPS/vector PDF is still required for a master vector. PNG is a temporary source-based asset, not claimed to be an exact vector reconstruction.

## Care limitation

Owner does not yet have a sewn-in care label photograph. Request to create one is interpreted as permission to design the section, not to invent temperatures or regulatory instructions. Current page says to follow the sewn-in care label. Obtain manufacturer-approved current instructions before creating a physical care label.

## Preview and validation

Use existing authenticated `/admin/products/P001/preview` and `/admin/products/P002/preview` on the stable development host. Draft/private preview purchase controls remain disabled by existing rules. Local browser tests use a disposable SQLite database, approved local fixtures, demo bag only; never make hosted catalogue writes, shipments or payments.

`npm run build`, `npm test`, `npm run test:alpin` verify compilation, existing commerce tests, explicit claim isolation, both ALPIN articles at 1440/390 px, four tech blocks, image decode, no Chinese DOM/attributes, no viewport overflow, gallery keyboard controls, actual bag item/variant persistence. Screenshots additionally visually inspected for Chinese embedded in images. Production not deployed. Await owner approval before any other product rollout.
