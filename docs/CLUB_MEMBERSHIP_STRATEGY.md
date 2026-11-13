# BigK Club — membership strategy

## What Club is
- **Free** loyalty for signed-in customers who accept the rules.
- **No VIP tiers**, no paid membership, no paid points.
- One program for B2C. B2B stays separate.

## How members join
1. Customer creates / signs in to a BigK account (email magic link).
2. Opens **Account → BigK Club** and taps **Join BigK Club — free**.
3. Accepts Club rules once.

Membership is **not** automatic on first purchase (keeps consent clear).

## Earn
- **1 point per complete €1** of eligible products **after all discounts**, incl. VAT.
- Does **not** earn on: shipping, gift-card *purchase*, event tickets.
- Points stay **pending** until:
  - confirmed delivery, **and**
  - waiting period (`BIGK_CLUB_WAIT_DAYS`, default 30), **and**
  - return review closed.

## Redeem
- Steps of **100 points = €3** off products.
- Cap: **10%** of eligible product subtotal.
- **Cannot combine** with a promotional coupon code.
- Checkout must be signed in with the same email.

## Welcome
- **25 points** once, after the first *qualifying* order fully clears the wait.
- Full refund of that order reverses welcome points; the one-time flag stays used.

## Expiry
- Available points expire **12 months** after they become spendable.
- Oldest lots first. Reminder ~14 days before expiry (email outbox).

## Ops switches
| Env | Role |
|-----|------|
| `BIGK_CLUB_ENABLED=true` | Turns Club on |
| `BIGK_CLUB_WAIT_DAYS=30` | Days after delivery before points release |

Leave Club **off** until delivery evidence + email jobs are reliable.

## Relation to promo codes
Promo codes and Club points are **mutually exclusive** on one order. Marketing codes live under **Admin → Marketing → Promo codes**.
