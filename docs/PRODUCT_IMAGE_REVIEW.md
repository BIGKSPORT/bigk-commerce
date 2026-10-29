# Product image review — Google Drive

Source: [Products folder](https://drive.google.com/drive/folders/1-YFE4G0a84mMNSUAcGQ5Fbkd2yuZbFAt).

Initial review found 388 image-file entries across nine product collections and their nested folders and reviewed 72 representative originals. The subsequent VELVET folder review inspected all 14 uploaded files, finding 12 distinct files after two exact duplicates. The website now includes **50 distinct supplied image files for 17 of the 27 catalogue records** (32 initial JPEGs, 11 VELVET JPEG/PNG files and seven Nano Down Vest JPEGs). Other poses, promotional graphics, garment-label photos, mixed-colour imagery and uncertain matches were not added to product galleries.

## Mappings applied

| Catalogue ID | Product | Catalogue colour / description | Drive collection | Gallery images |
| --- | --- | --- | --- | --- |
| P007 | Alpine Gillet | cream-black Gillet | Alpin Vest PRO | 4 |
| P009 | Alpine FZ Hood | cream FZ hood | Alpin hood | 5 |
| P010 | Core-pants | black cuffed leg | Core Pants | 3 |
| P011 | Neofit pants | black open leg | Neofit Pants | 4 |
| P014 | Alpine hood gillet | cream hood gillet | Alpin vest | 2 |
| P015 | Coreloose.2 | emerald | Cooreloos 2 | 3 |
| P017 | Velvet WMS hood | black-cream FZ hood | VELVET | 1 |
| P018 | Velvet WMS hood | emerald FZ hood (cream panel visible) | VELVET | 1 |
| P019 | Nandown JKT | black  FZ jkt | Nano Down Jacket | 4 |
| P020 | Nandown JKT | black FZ jkt | Nano Down Jacket | 4 |
| P021 | Nandown FZ Gillet | black FZ gillet | Nano Down Vest | 7 |
| P022 | Summit | black FZ hood jkt | Summit resized | 4 |
| P023 | Snake scarf | black fleece scarf | SNAKE SCARF | 1 |
| P024 | Snake scarf | cream fleece scarf | SNAKE SCARF | 1 |
| P025 | Snake scarf | emerald fleece scarf | SNAKE SCARF | 1 |
| P026 | Velvet WMS hood | cream FZ hood | VELVET | 4 |
| P027 | Velvet WMS hood | black FZ hood (charcoal appearance) | VELVET | 5 |

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

Specific uncertainties:

- The Alpin hood shoot reviewed shows cream/teal. It is not used for the black hood record.
- The Alpin vest folder contains modelled hooded garments and flat shots that appear to have a stand collar. Black flat shots were not assigned to either a hooded or non-hooded SKU without confirmation.
- The Alpin Vest PRO shoot is cream/black. It is not used for an all-black vest.
- The Cooreloos 2 main shoot is teal/emerald; the nested folder is named Brown. Neither is assigned to the cream record.
- Nano Down Jacket photos are not reused for the Nano Down vest.
- The source catalogue contains duplicate SKU records P012/P013 and P019/P020. Existing records were not merged. P019/P020 share images because both describe the same black jacket/SKU. Confirm the source records before approving stock to avoid counting the same goods twice.

## Website implementation

The storefront shows products with images ahead of placeholders in featured sorting. Hero and category imagery now reference the matched Drive originals. Product grids, galleries, bag, comparison and category images use Next.js responsive image optimisation with AVIF/WebP negotiation; original masters remain unmodified in Drive; the website now uses separately optimized WebP derivatives (see IMAGE_OPTIMIZATION.md). Brand logos stay as SVGs. The site does not hotlink private Drive files or require visitors to sign into Google.

Prices, inventory, active flags and approval flags were not changed. Photo matching does not authorize selling an item.

## Existing local databases

New installations receive the updated galleries through the catalogue seed. For an existing review database, run `npm run catalog:sync-images` with the appropriate environment. This explicit task updates only image lists, skips approved or active products, refuses live mode and audits changes. Back up the target database before applying changes outside this local review workspace. It does not change prices, inventory or order snapshots.

## VELVET four-colour review

Folder: [VELVET](https://drive.google.com/drive/folders/1o0SLEjPmbX1NGCUEfukY0oW9oANDW7Cs). All 14 files were downloaded and visually inspected; two pairs have identical SHA-256 hashes. All four catalogue colourways are represented. Catalogue names, SKUs, prices, approval and stock were preserved. The black fabric appears charcoal/mottled in the images; this is not treated as a fifth colour. The emerald model image includes a cream upper-body panel. Source images were reviewed without recolouring or regeneration; the website uses separately optimized WebP derivatives, with originals retained in Drive.

| Colourway / catalogue ID | Available views installed | Missing views in this folder |
| --- | --- | --- |
| Black/cream · P017 · 25000701 | One full front model view | Back, side and detail views |
| Emerald/cream · P018 · 25000702 | One clear front model view | Back, side and detail views |
| Cream · P026 · 25000704 | Flat front, angle and back; model detail | Full-length front/back model views |
| Black · P027 · 25000703 | Model front/back; flat front/angle/back | Dedicated close-up detail view |

`IMG_2318(1).jpg` duplicates `IMG_2318.jpg` exactly. `IMG_2318_副本(1).jpg` duplicates `IMG_2318_副本.jpg` exactly. Only one copy of each is installed. `Compacte khaki sherpasjaal op model.png` shows a scarf over the emerald/cream hoodie; it was excluded from the hoodie gallery because it hides the neckline. This does not mean the file is missing. All 14 reviewed sources and decisions are recorded in `VELVET_IMAGE_REVIEW.json`. No other-colour back view was substituted for a missing VELVET back view.

## Nano Down Vest review — completed upload

Folder: [Nano Down Vest](https://drive.google.com/drive/folders/1ff7_QKRLTH3xY5pfgyBX6FG_v65YvRBa). The completed listing contains 81 files. Twenty-six representative originals were downloaded and visually reviewed, including all nine IMG_* flat/detail files and a spread of model poses. Seven matching black sleeveless puffer views are installed for P021 (SKU 25303001): 1U103249 (closer front), 1U103238 (closed front), 1U103210 (open front), 1U103248 (shoulder detail), 1U103254 (model back), IMG_2330 (flat front), IMG_2329 (flat back). Core front/back/detail coverage is now present. The initial nine-file upload had no back view; that earlier gap is resolved by the completed upload. 1U103204 shows pants without the vest and is excluded. Remaining lifestyle/detail alternatives stay in Drive. `NANO_VEST_IMAGE_REVIEW.json` records the 26 inspected files; it does not claim every one of the 81 files was downloaded or inspected.
