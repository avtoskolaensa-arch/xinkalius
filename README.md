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
- Daily order counts plus cash/terminal totals by actual collection timestamp (Asia/Tbilisi), with business days running 04:00 to the next 04:00. Active orders and history survive rollover.
- `/admin/statistics`: today, yesterday, Monday-based week, month, year and previous year. Every reporting boundary is 04:00 local time, and pre-04:00 receipts belong to the preceding business date. Hour charts run 04–03. The open statistics page refreshes at rollover and on return to the foreground; ordering hours remain a separate setting. Owner-scoped server aggregates include all collected non-cancelled orders, without the kitchen queue limit. Turnover, snapshot product cost/gross profit, average check, units, daily/hourly/monthly chart, payment/channel breakdown and top 10 products. Delivery receipts are separate from product gross profit. Result after recorded expenses = collected revenue including delivery − historical product cost − paid operating expenses. Unknown historical cost keeps the result unknown. Missing historical cost or collection dates are explicitly flagged.
- Settings: acceptance pause, daily opening hours, base preparation time, capacity per khinkali batch, extra minutes per batch, global minimum order and contact information.
- Three complete UI languages (KA/EN/RU), including admin, errors, accessibility labels, dates and document metadata. Language cookie survives navigation and reload. Product names/descriptions/ingredients/allergens and business text have separate EN/RU authoring fields. Existing sample copy is translated; customer names/notes/addresses and expense memos remain as entered. The approved Georgian brand artwork is unchanged.
- Configurable polygon delivery zones with translated names, fee, travel minutes and minimum order. OSM pin picker, manual coordinates, explicit geolocation button and kitchen map link. Server derives zone from the pin, rejects outside-zone delivery and snapshots the pin/zone/travel time. First enabled matching zone wins. Presets are test service areas, not official district boundaries. No geocoding service or address autocomplete.
- My usual / repeat-order flow loads the owned source order and fresh catalog, reports changed prices/minimums and unavailable/deleted items, and explicitly replaces the basket only after review. It never auto-submits or copies old payment/pricing.
- Kitchen estimates include all received/cooking khinkali units (including previous business days and POS); ready/delivering orders are excluded. Preparation = base + max(0, ceil((queued + incoming units) / batch capacity) − 1) × extra batch minutes. Server snapshots ETA at submission. This is a conservative estimate, not exact kitchen scheduling or a capacity reservation; concurrent submissions can see the same queue.
- `/admin/expenses`: durable paid-expense ledger, six reporting periods, categories, source of payment, paid-at time in Tbilisi and auditable void reasons. Ingredient purchases and packaging already in product cost must not be re-entered. Closed-shift expenses cannot be voided. Totals include all matching rows; list shows up to 500.
- `/admin/shifts`: explicit opening float, drawer sales, expenses, cash additions/removals, counted closing balance, frozen expected amount and discrepancy. Only one open shift per owner. 04:00 never closes a shift. Drawer cash collection requires an open shift; courier-held cash and terminal payments are excluded from physical drawer balance. Courier handover is recorded as a cash addition with order reference. Cash movements are not operating expenses.
- Expense/open/movement/close writes use request keys and hashes; atomic guards prevent cash entries attaching to a closed shift. Pending request drafts are stored on the device for retry; authoritative records are in D1.
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
2. Courier arrangements and approved delivery-zone boundaries/tariffs/minimums. The current map zones and queue capacity are illustrative presets.
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

Statistics verification: `node --test tests/statistics.test.mjs` checks actual SQLite migrations and aggregate queries, Tbilisi calendar boundaries, owner/payment filtering, historical costs, unknown legacy costs, negative profit and more than 300 orders. Desktop/mobile UI was checked with an isolated fixture removed before publication.

## Current verification

```sh
node node_modules/typescript/bin/tsc --noEmit
node --import ./tests/support/register.mjs --test tests/operations.test.mjs tests/statistics.test.mjs
```

17 tests exercise actual appended migrations and route handlers against isolated SQLite with a D1-shaped adapter and stub identity. Covers geo boundaries, server pricing, legacy queue JSON, >300 queued orders, reordering, idempotency, cash/change, collection-before/after-close, expense void guards, owner isolation and 04:00 reporting. This is not an authenticated production E2E or bank integration test.

Desktop and 320px UI checks used a temporary in-browser fixture (removed before build): language switching, reorder confirmation, pin-derived delivery pricing, successful test checkout, expense save and cash shift open/close discrepancy. Russian settings and checkout had no horizontal body overflow. Browser/system-owned date/file/location prompts follow device language. Map requires external OSM tile access; coordinate inputs remain available if tiles fail.
