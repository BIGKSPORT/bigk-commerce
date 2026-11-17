# Seller catalogue: one source in the backoffice

The seller catalogue uses the existing product records, reviewed product families, colour identifiers, images, size variants and category labels. There is no second editable catalogue or copied production stock.

## Editing

- Backoffice → Products → Edit shared product: model name, shared description/category, composition, fit, care, details and enabled presentation/size information.
- Edit the individual colour record for EUR retail price, stock, colour identifiers and assigned photos. Actual variant IDs are retained.
- Backoffice → Categories: category labels and category assignments. Seller navigation uses the saved Dutch label, with the existing English/name fallback. Removed categories disappear from filters; their products remain under All products, matching existing catalogue behaviour.
- Existing featured-product ordering is retained as the default collection order. Sellers can also sort by name or retail price.

Reopen the seller tab or use Voorraad vernieuwen to fetch changes immediately. A visible, authenticated seller workspace also refreshes every 60 seconds. Refresh does not clear selected quantities or close product details. Background responses cannot overwrite a newer explicit load; session expiry clears private selection state.

## Selling

Each existing product family appears once, with colour buttons. Category, colour, size and stock filters use real combinations. Photos are existing product images rendered with Next Image, lazy loading and responsive sizes; no generated product photos or invented technical claims.

Productinformatie en alle maten opens a native accessible dialog with the selected colour, image gallery, saved product information and a colour × size matrix. Missing or sold-out sizes cannot be ordered. Select quantities in the card or dialog; they share the same browser selection.

Presentation mode hides internal commission, dashboard metrics and the order sidebar. The catalogue expands to the available width; mobile filters can collapse. Retailer gross margin is indicative at the saved VAT-inclusive recommended retail price and existing VAT-exclusive wholesale factor, before other expenses. No pricing factors, commission rules or VAT rules were changed.

Owner-only seller previews continue to be read-only. Selecting quantities in preview does not save customers/orders or create seller sessions.

## Verification and scope

Dedicated CI covers actual backoffice group/category/media/product editing and subsequent seller reads; name, shared description, category label, photos, colour, price and available stock; multiple colour records grouped once; archived categories; and preservation of historical order snapshots. UI checks cover desktop/iPhone/Android, filters, exact colour-size combinations, gallery, matrix, disabled stock, retained quantities and refreshed data.

Changes are limited to the private seller catalogue. Public storefront pages, checkout, inventory mutations, invoices and Peppol integrations are unchanged. Invoicing/Peppol is a separate next step.
