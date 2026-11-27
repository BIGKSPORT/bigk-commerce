# Storefront funnel measurement

The storefront can publish GA4-shaped events to the existing Tag Manager data layer. The release flag `NEXT_PUBLIC_ECOMMERCE_EVENTS` defaults to false. It is set at build time.

| Event | When it is published |
| --- | --- |
| `view_item` | A purchasable product page loads |
| `add_to_cart` | A selected variant is added successfully |
| `begin_checkout` | A live checkout loads with a populated bag |
| `purchase` | A private receipt confirms a live Stripe payment |

Events carry product data and amounts in EUR. Purchases include an order ID for transaction deduplication. The event payload excludes customer contact details and receipt credentials.

Before enabling the flag, configure the corresponding custom event triggers and GA4 ecommerce tags inside the existing GTM container. Require analytics consent for those tags and configure page and referrer reporting to omit URL fragments, particularly on private receipt pages. Validate the events, item values, campaign attribution and purchase deduplication in a test property before enabling the production release flag. Paid orders remain authoritative in the backoffice. Receipt-based analytics can miss a purchase when a shopper never returns from Stripe.

Saved bags and checkout progress appear in the backoffice. The records expire seven days after their last update and cannot identify a shopper who has never provided an email. The Orders view counts unique contacts whose latest checkout expired or was cancelled 2–48 hours ago and shows how many have a recorded marketing opt-in. Anonymous bags, pending payments and newer purchases are excluded from that count. Recovery emails require a separate consent-aware workflow, eligibility checks before each send, a return-to-checkout link, and delivery reporting.

## Checkout recovery draft

Start with shoppers who submitted checkout and whose email is approved for this type of follow-up. Recheck the latest consent, stock, and paid order status for that shopper before each send. Skip expired carts and active payment attempts. Cancel the sequence after purchase or unsubscribe. Use a fresh checkout session, with current stock and prices, when the shopper returns. A generic shop link can be used during copy review.

| Step | Timing to test | Subject |
| --- | --- | --- |
| First reminder | Two hours after checkout was left | Je BIG K-selectie staat nog klaar |
| Help choosing | The next day, if still unpaid | Hulp nodig met je BIG K-bestelling? |

### First reminder

Je was bijna klaar met je BIG K-bestelling. Wil je verdergaan? Bekijk je selectie, controleer je maat en rond je bestelling af wanneer het past.

Button: Verder naar mijn winkelwagen

Heb je een vraag over je bestelling? Antwoord gerust op deze mail.

### Help choosing

Twijfel je over de maat of wil je weten hoe de levering verloopt? Stuur ons je vraag. We helpen je graag verder.

Button: Bekijk mijn selectie

Measure recipients, deliveries, clicks, completed purchases and linked order revenue separately. Use a small holdout group if volume allows, so purchases that would have happened anyway are distinguishable from the effect of the reminders.
