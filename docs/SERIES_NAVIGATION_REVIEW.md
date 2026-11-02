# Product series navigation — development experiment

The series selector sits above the collection. Selecting ALPIN, VELVET, CORE, NANO DOWN or RIBS reveals its individual models below the logo row and filters the colour cards below. Each model links to its shared product page with a photographed, visible colour selected. On desktop the model rail sits beside a short introduction; on mobile it scrolls horizontally. Explore all products restores the full collection. Series links work as normal server-rendered URLs and preserve series selection through Back and refresh.

Series are a merchandising layer, not product/inventory merges. ALPIN contains parent IDs P001, P006, P008 and P012. VELVET contains P017, P018, P026 and P027 as four distinct models. CORE contains Core.2 / P003, Corelosse.2 / P015 and Core Pants / P010. NANO DOWN contains Nano Down Jacket / P019 and Nano Down Gillet / P021. RIBS contains RIBS-LOW-WHITE, RIBS-MEDIUM-WHITE and RIBS-LONG-WHITE, each retaining its three colours. Names and all colour, variant, price and stock relationships stay intact. Only visible products are used, so public navigation does not expose private drafts. No database changes are required.

Original artwork, copied unchanged from the owner's Series folder:
- ALPIN: https://drive.google.com/file/d/1FHjFlIfpWfuemxwXzjrsIoPhraPHzU4o/view → public/brand/series-alpin.jpg
- VELVET: https://drive.google.com/file/d/1yNFR7LjC-GK9nqDsgHwaHRiamqOcb_86/view → public/brand/series-velvet.jpg

Additional original artwork from the same Series folder:
- CORE: https://drive.google.com/file/d/1m_Iq2Zaaw5Ewsj-Zw89nqRqAcF5Vkaiu/view → public/brand/series-core.png
- NANO DOWN: https://drive.google.com/file/d/1iHb0BEVDwGjpk6RHSLzTA-xg4NqADPxY/view → public/brand/series-nano-down.png
- RIBS: https://drive.google.com/file/d/16Ypmkscf-QkUgzIIn1P_COEWH66E0p_U/view → public/brand/series-ribs.png

These three source files are named .jpg in Drive but contain transparent PNG artwork. Their original bytes are preserved with the matching .png extension for correct browser content types.

Review links on the existing authenticated development preview:
- /?series=ALPIN#catalog
- /?series=VELVET#catalog
- /?series=CORE#catalog
- /?series=NANO-DOWN#catalog
- /?series=RIBS#catalog

The existing grouped-product browser check now verifies all five series, their model/colour counts, return to all products, direct links, Back, refresh and responsive width. It captures series-alpin-1440.png, series-alpin-390.png, series-velvet-1440.png series-velvet-390.png and desktop/mobile captures for CORE, NANO DOWN and RIBS. The mobile selector scrolls the active series into view on direct links and refresh; each newly selected model row starts at its first model. All series/model links disable automatic product-page prefetching. Logos are small local images and model thumbnails load through the existing image optimizer.

This experiment is for development review. Production is not changed.
