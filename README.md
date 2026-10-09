# ხინკალიუსი / XINKALIUSI

Owner-private, pre-launch ordering prototype for a Batumi khinkali kitchen.

## Implemented

- Aqua/cream/red responsive storefront using the approved Georgian wordmark artwork.
- Batumi hero (Alphabet Tower, Ferris wheel, Ali and Nino), lightweight WebP assets and a reduced-motion-aware blink.
- Original static mascot with only gentle left/right eye glances and brief blinking. Small inline SVG eye layers use CSS transforms; no sprite story, cart reaction, video or per-frame React updates. Motion pauses offscreen/in hidden tabs, respects reduced-motion preferences, and can be disabled.
- D1-backed product management: photo upload, name, category, ingredients/allergens, unit price/cost, minimum quantity, availability.
- R2 uploads with authenticated owner checks and PNG/JPEG/WebP validation.
- Shared catalog used by storefront and walk-in POS; price and availability validated again server-side.
- Guest-shaped checkout form for delivery/pickup, cash-due test orders, persistent draft and request key.
- Durable order history at `/orders`; reload does not remove saved orders.
- Kitchen queue at `/admin`, polling, optional sound, fulfillment and payment states tracked separately.
- Quick till at `/admin/pos`: optional customer name, cash/terminal records, change, and kitchen submission.
- Daily order counts plus cash/terminal totals by actual collection timestamp (Asia/Tbilisi).
- Settings: acceptance pause, daily opening hours, preparation/travel estimates, delivery fee/minimum order, contact information.
- Server-calculated integer-tetri prices; order price and cost snapshots retained. Customer responses redact costs.
- Idempotent submissions, guarded payment/fulfillment updates, cross-owner isolation, and same-origin writes.
- Existing WebMCP cart-staging tool preserved; it never submits orders or payments.

## Access and launch boundary

This is NOT a live restaurant checkout. The whole Site must remain owner-private.
The current ChatGPT sign-in scopes each user's demo data; it is not production restaurant staff authorization or public guest access. Every admin API checks that identity. Do not simply make the Site public.

All menu samples, costs, prices, ingredient/allergen text, photos, delivery fees and time estimates are illustrative. Initial sample records are created once per owner at runtime, separate from schema migrations. Replace them with real business data before launch.

Cash and external-terminal statuses are test bookkeeping only: no payment is processed and no fiscal receipt is issued. Online card/wallet/bank payments are intentionally unavailable, and are never labelled successful. Collected orders cannot currently be cancelled: actual refunds are not implemented. Old `demo_unpaid` records may be cancelled but cannot be completed as paid.

Photos live in R2, product/order/settings records in D1, code/assets/migrations in Git. A code backup alone does not back up the database or uploaded photos.

## Still needed before public launch

1. Final menu/recipes/allergens/photos, costs/prices/minimums, address, phone, opening hours and realistic kitchen capacity.
2. Courier arrangements, delivery service area validation and final delivery/packaging fees.
3. Explicit staff allowlist/roles plus public guest checkout with private order-specific access; phone verification, SMS status/recovery and a provider.
4. Bank merchant agreement and sandbox credentials; integrate verified server callbacks, abandonment/retry/refund handling. Never treat a browser return as proof of payment. `/callback` belongs to platform sign-in; use a separate bank path.
5. Refund/cancellation/privacy/delivery terms, real domain, data backup/export and monitoring.
6. Bank tests and authenticated device/browser walkthrough before opening to real customers.

Ingredient-level stock, loyalty, promotions, scheduled slots, live courier GPS, automatic bank-terminal integration and fiscal cash-register integration are not implemented.

## Development and verification

React + TypeScript + Vinext/Vite, Cloudflare Workers, D1, R2, Drizzle migrations. Preserve the pnpm lockfile.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm db:generate
pnpm build
```

Use the managed Sites install/build/preview helpers in its managed environment. Schema changes use appended Drizzle migrations; never alter an applied migration.

Validation for this version: TypeScript; pure pricing/minimum/availability/hours/input checks; independent SQL/migration/idempotency review. The browser checked desktop/mobile rendering and cart/pickup calculations with an isolated fixture. That temporary fixture was removed before build. Authenticated end-to-end production checkout and bank/SMS tests remain pending.
