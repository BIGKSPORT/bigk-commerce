# Alpin Fleece Pro — staged catalogue/image mapping

Status: **internal staging only**. Do not publish, deploy, merge, update live stock, or contact customers without owner approval.

## Confirmed product
- Family: **Alpin Fleece Pro** (13th approved BIG K product family).
- Black: supplier code **25303101**, retail price **EUR 146.90**.
- Emerald Green: supplier code **25303102**, retail price **EUR 146.90**.
- Each size has its own barcode. Barcode identifies the exact colour/size variant; supplier code identifies colour.
- **XS was not ordered**. Supplier-listed XS barcodes must not be treated as stock or available variants.
- **Stock.xlsx column E** is authoritative for actual quantities. Do not use column G as inventory.
- Do not infer variant stock from barcode existence.

## Drive assets (verified 2026-10-30)
Folder: https://drive.google.com/drive/folders/106AbX8Ci9zJlJ-8UUHI1_MF7103-F7Ln

Folder listing contained **49 image files**, including original JPG photographs and four edited black PNGs. The owner confirms edited black images match the real product and says approximately three original black photographs are also in the folder.

Black-edited files (Drive IDs):
- Zwarte teddyjas van achteren.png — 1se2bc22B2d9mDdnB_XSarhcj3mGBEZkM
- Zwarte fleecejas met rode ritsdetails.png — 1G3ShLl9XjXScTbWeoAyzITWkctX6hr0P
- Zwarte teddyfleecejas van achteren.png — 12nHrqovhppsQ7OMmm8N_Np_nrnbLmQ4b
- Zwarte sherpa jas met BIG K-patch.png — 1Z2x1EGaqCrwesHLxTeg5PItbUiQec-42

## Next QA gates
1. Inspect original JPGs and identify the approximately three **original black** shots by visual content; do not rely on numeric filenames.
2. Identify green originals by visual inspection and separate black vs green galleries.
3. Select a primary image and supporting front/back/detail photos for each colour. Keep originals and edits distinguishable.
4. Match each barcode and size to the correct colour; check Stock.xlsx for actual positive quantity and duplicate/ambiguous size labels.
5. Verify SKU 25303101 / 25303102 against existing P001/P002 catalogue records before proposing changes.
6. Prepare a reviewable implementation on this isolated QA branch. No customer-facing changes or live inventory updates without explicit approval.

Owner confirmed colour-edit accuracy and instructed to start the internal run.


## Owner-confirmed BLACK image gallery (2026-10-30)

The owner explicitly identified these **six images as Black (SKU 25303101)**. This supersedes any previous filename-based uncertainty:

| File | Drive file ID |
|---|---|
| 10-2441167-2.jpg | 1bbY2l2yJ5WyCT2-8PfEq_CqyZjimv0Vk |
| 10-2441174-2.jpg | 1uqRyQhPHwcZwtvHP1edkhbn1bL4AqK8u |
| Zwarte fleecejas met rode ritsdetails.png | 1G3ShLl9XjXScTbWeoAyzITWkctX6hr0P |
| Zwarte sherpa jas met BIG K-patch.png | 1Z2x1EGaqCrwesHLxTeg5PItbUiQec-42 |
| Zwarte teddyfleecejas van achteren.png | 12nHrqovhppsQ7OMmm8N_Np_nrnbLmQ4b |
| 10-2441164-2.jpg | 1Qd7JYkmB4oP-fANE_xKUDOL8HR6sMqBv |

These six are approved for the **black colour assignment**. Do not automatically assign the remaining files to green; visually review them. The other black PNG, `Zwarte teddyjas van achteren.png`, is present in Drive but was **not included in the owner's explicit six-file list**, so keep it pending confirmation.

This documentation update is internal only; no deployment or live catalogue change.
