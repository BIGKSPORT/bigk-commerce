# Product image review — Google Drive

Source: [Products folder](https://drive.google.com/drive/folders/1-YFE4G0a84mMNSUAcGQ5Fbkd2yuZbFAt).

Found 388 image-file entries across nine product collections and their nested folders. Downloaded and visually reviewed 72 representative originals. Selected 32 distinct original JPEGs for **12 of the 27 catalogue records**. Other poses, promotional graphics, garment-label photos, mixed-colour imagery and uncertain matches were not added to product galleries.

## Mappings applied

| Catalogue ID | Product | Catalogue colour / description | Drive collection | Gallery images |
| --- | --- | --- | --- | --- |
| P007 | Alpine Gillet | cream-black Gillet | Alpin Vest PRO | 4 |
| P009 | Alpine FZ Hood | cream FZ hood | Alpin hood | 5 |
| P010 | Core-pants | black cuffed leg | Core Pants | 3 |
| P011 | Neofit pants | black open leg | Neofit Pants | 4 |
| P014 | Alpine hood gillet | cream hood gillet | Alpin vest | 2 |
| P015 | Coreloose.2 | emerald | Cooreloos 2 | 3 |
| P019 | Nandown JKT | black  FZ jkt | Nano Down Jacket | 4 |
| P020 | Nandown JKT | black FZ jkt | Nano Down Jacket | 4 |
| P022 | Summit | black FZ hood jkt | Summit resized | 4 |
| P023 | Snake scarf | black fleece scarf | SNAKE SCARF | 1 |
| P024 | Snake scarf | cream fleece scarf | SNAKE SCARF | 1 |
| P025 | Snake scarf | emerald fleece scarf | SNAKE SCARF | 1 |

These are visual matches based on the product folders, garment construction and colour, not final business approval of every SKU. Core Pants label photography additionally shows the matching code 25302701; that label image is retained in local review material only, not in the public gallery. Chinese colour filenames for the scarves were checked visually: black, khaki/cream and blue-green/emerald. Original catalogue colour names were preserved.

`PRODUCT_IMAGE_SOURCES.json` records the source Drive link, filename and SHA-256 for each installed image. No authenticated download URLs, session tokens or credentials are included. Drive files, folders, permissions and sharing were not modified.

## Records awaiting a confident match

- **P001** — Apline Fleece · black FZ fleece · Apline Fleece 25303101
- **P002** — Alpine FZ · dusty-blue FZ fleece · Alpine FZ 25303102
- **P003** — Core.2 · black 1/4 zip · Core.2 25301801
- **P004** — Core.2 · dusty-blue 1/4 zip · Core.2 25301802
- **P005** — Core.2 · cream 1/4 zip · Core.2  25301803
- **P006** — Alpine Gillet · black gillet · Alpine Gillet 25303201
- **P008** — Alpine FZ hood · black FZ hood · Alpine FZ hood 25301601
- **P012** — Alpine gillet hood · black hood Gillet · Alpine gillet hood 25301701
- **P013** — Alpine gillet hood · black hood gillet · Alpine gillet hood 25301701
- **P016** — Coreloose.2 · cream round neck · Coreloose.2 25301903
- **P017** — Velvet  WMS hood · black-cream FZ hood · Velvet  WMS hood 25000701
- **P018** — Velvet  WMS  hood · emerald FZ hood · Velvet  WMS  hood 25000702
- **P021** — Nandown FZ Gillet · black FZ gillet · Nandown FZ Gillet 25303001
- **P026** — Velvet WMS hood · cream FZ hood · Velvet WMS hood 25000704
- **P027** — Velvet WMS hood · black FZ hood · Velvet WMS hood 25000703

Specific uncertainties:

- The Alpin hood shoot reviewed shows cream/teal. It is not used for the black hood record.
- The Alpin vest folder contains modelled hooded garments and flat shots that appear to have a stand collar. Black flat shots were not assigned to either a hooded or non-hooded SKU without confirmation.
- The Alpin Vest PRO shoot is cream/black. It is not used for an all-black vest.
- The Cooreloos 2 main shoot is teal/emerald; the nested folder is named Brown. Neither is assigned to the cream record.
- Nano Down Jacket photos are not reused for the Nano Down vest.
- The source catalogue contains duplicate SKU records P012/P013 and P019/P020. Existing records were not merged. P019/P020 share images because both describe the same black jacket/SKU. Confirm the source records before approving stock to avoid counting the same goods twice.

## Website implementation

The storefront shows products with images ahead of placeholders in featured sorting. Hero and category imagery now reference the matched Drive originals. Product grids, galleries, bag, comparison and category images use Next.js responsive image optimisation with AVIF/WebP negotiation; original source files remain unmodified. Brand logos stay as SVGs. The site does not hotlink private Drive files or require visitors to sign into Google.

Prices, inventory, active flags and approval flags were not changed. Photo matching does not authorize selling an item.

## Existing local databases

New installations receive the updated galleries through the catalogue seed. For an existing review database, run `npm run catalog:sync-images` with the appropriate environment. This explicit task updates only image lists, skips approved or active products, refuses live mode and audits changes. Back up the target database before applying changes outside this local review workspace. It does not change prices, inventory or order snapshots.
