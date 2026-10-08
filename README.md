# ხინკალიუსი / XINKALIUSI

Private, pre-launch prototype for a khinkali takeaway and delivery kitchen in Batumi.

## What works

- Georgian mobile-first menu, category selection, quantities and draft cart.
- Delivery or pickup, validated name/Georgian mobile/address inputs.
- Server-calculated integer-tetri totals; the client cannot set prices.
- Durable D1 test orders with idempotency keys to prevent duplicate submissions.
- Protected kitchen screen at `/admin`, polling every ten seconds and updating fulfillment stages.
- Per-user order isolation for the owner-private demonstration.
- Original transparent raster logo concept and explicitly illustrative food imagery.

## Current limitations

This is a demonstration, **not a launched food business or a live payment system**. The entire site must remain owner-private until production authorization is implemented. All prices, ingredients, delivery fees and product imagery are examples. Real orders and card charges are unavailable. Payment status always remains `demo_unpaid`; no simulated order is labelled paid.

`/admin` and the API currently isolate test data by the signed-in ChatGPT user. Before enabling public ordering, replace this demo ownership model with an explicit staff allowlist/roles and a public customer checkout with order-specific access. Merely making the Site public does not complete that change.

## Before taking real orders

1. Finalize recipes, allergen statements, per-piece prices, minimum quantities, kitchen address, phone, opening hours, delivery coverage/fees and realistic preparation capacity.
2. Select the business's bank and obtain approved merchant access through its secure process. Keep secrets server-side and out of source control.
3. Integrate TBC Checkout or Bank of Georgia hosted checkout. Persist an unpaid order before creating the payment, validate signed callbacks or perform an authenticated payment-status lookup, compare amount/currency/order identity, and make updates idempotent. Browser redirects alone do not prove payment.
4. Test success, failure, abandoned payment, duplicate callback, refund and payment-to-kitchen behavior in the bank's supported test environment. Only verified paid orders should enter paid fulfillment.
5. Finalize delivery, cancellation/refund and privacy terms using the business's actual details. Configure the real domain and publish only after the launch checks.

Official payment references:
- https://developers.tbcbank.ge/docs/checkout-overview
- https://api.bog.ge/docs/payments/introduction

## Development

The project uses React, Vinext, TypeScript, Tailwind and Cloudflare D1. Preserve the pnpm lockfile.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm build
pnpm db:generate
```

The managed Sites runtime uses its supervised preview and provided install/build helpers. Local D1 migrations use the generated `dist/server/wrangler.json`; production migrations are applied by Sites before deployment. Do not rewrite migrations after deployment.

Product content and sample prices: `lib/menu.ts`.
Order validation and transitions: `lib/order-validation.ts`.
Database schema: `db/schema.ts`.
Brand assets: `public/brand-logo.png` and `public/khinkali.png`.

The logo is a raster concept, not a production vector master. Both image assets were generated with the built-in image tool, with final briefs for a red/ink Georgian logo and illustrative khinkali food photography. Replace the food image with actual product photography before launch.

## Agent assistance

The menu exposes `set_khinkali_cart` only in browsers supporting WebMCP. It stages a cart and never submits an order or takes payment. Its absence does not affect normal ordering. WebMCP runtime QA was unavailable in this authoring environment.
