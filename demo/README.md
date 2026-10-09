# Public design preview

This isolated static entry reuses the approved storefront, mascot, product cards,
cart, map and KA/EN/RU translations. It is designed for GitHub Pages at
`https://avtoskolaensa-arch.github.io/xinkalius/`.

Build with:

```sh
node node_modules/vite/bin/vite.js build --config vite.demo.config.ts
```

Publish `dist-demo/index.html` as the repository root `index.html` and
`dist-demo/demo-assets/` as the repository root `demo-assets/`. Images and fonts
reference the existing public visual files at `/xinkalius/public/`.

The demo adapter returns only hard-coded sample products, without their cost
field, and sample delivery settings. It has no backend connection. Checkout
submission is disabled, personal-information fields are read-only, and every
write fails explicitly. No order or payment is simulated as successful.
Only basket choices are saved to this demo's separate browser-storage key.
External OpenStreetMap tiles remain available with attribution.

The build-only transform fails when expected source anchors change so that demo
safety changes cannot silently disappear after a production refactor. Production
source files, database, authentication and hosting are unaffected.
