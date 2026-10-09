import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL(".", import.meta.url));
const demo = path.join(root, "demo");
const base = "/xinkalius/";
const visuals = `${base}public/`;

function replaceOnce(code: string, needle: string, replacement: string, filename: string) {
  if (code.split(needle).length !== 2) throw new Error(`Demo transform expected exactly one match in ${filename}: ${needle}`);
  return code.replace(needle, replacement);
}

// All demo changes are made in this isolated build, never in production source.
function designDemo(): Plugin {
  return {
    name: "xinkaliusi-design-demo",
    enforce: "pre",
    resolveId(source, importer) {
      if (source === "./site-shell" && importer?.split("?")[0] === path.join(root, "components/storefront.tsx")) return path.join(demo, "site-shell.tsx");
    },
    transform(source, id) {
      const file = id.split("?")[0];
      let code = source;
      if (file === path.join(root, "components/storefront.tsx")) {
        code = `import { DemoNotice, demoCopy } from "@/demo/notice";\n${code}`;
        code = replaceOnce(code, 'const STORAGE = "xinkaliusi-checkout-v2";', 'const STORAGE = "xinkaliusi-public-design-demo-cart-v1";', file);
        code = replaceOnce(code, '<a className="primary" href="/signin-with-chatgpt?return_to=%2F" target="_top">{t("საცდელ სივრცეში შესვლა")}</a>', '<DemoNotice compact />', file);
        code = replaceOnce(code, 'disabled={!open || invalid || busy || subtotal <', 'disabled={true || !open || invalid || busy || subtotal <', file);
        code = replaceOnce(code, '{busy ? t("ინახება…") : t("საცდელი შეკვეთის გაგზავნა")}', '{demoCopy[locale].submit}', file);
        code = replaceOnce(code, '</SheetHeader><div className="checkout-body">', '</SheetHeader><DemoNotice compact /><div className="checkout-body">', file);
        code = replaceOnce(code, 't("გადაამოწმე არჩევანი და შეავსე საკონტაქტო ინფორმაცია.")', 'demoCopy[locale].form', file);
        code = replaceOnce(code, 't("თანხა არ ჩამოგეჭრება. ტესტისთვის გამოიყენე გამოგონილი მონაცემები. სტატუსს „ჩემი შეკვეთებიდან“ ნახავ.")', 'demoCopy[locale].unavailable', file);
        for (const field of ["name", "phone", "address", "note"]) code = replaceOnce(code, `onChange={e => change("${field}", e.target.value)}`, "readOnly", file);
        code = replaceOnce(code, 'href={`/orders#${order.id}`}', 'href="#menu"', file);
      }
      if (file === path.join(root, "components/brand.tsx")) {
        code = replaceOnce(code, 'href="/"', `href="${base}"`, file);
        code = replaceOnce(code, 'src="/approved-brand.png"', `src="${visuals}approved-brand.png"`, file);
      }
      if (file === path.join(root, "components/mascot-hero.tsx")) {
        for (const asset of ["hero-open.webp", "hero-blink.webp"]) code = replaceOnce(code, `src="/${asset}"`, `src="${visuals}${asset}"`, file);
      }
      if (file === path.join(root, "app/fonts.css")) code = code.replaceAll('url("/fonts/', `url("${visuals}fonts/`);
      return code === source ? undefined : { code, map: null };
    },
    generateBundle(_options, bundle) {
      // PostCSS inlines @import files before Vite's transform hook sees them.
      // Rebase the resulting font URLs in the final stylesheet as well.
      for (const output of Object.values(bundle)) {
        if (output.type === "asset" && output.fileName.endsWith(".css") && typeof output.source === "string") {
          output.source = output.source.replace(/url\((['"]?)\/fonts\//g, `url($1${visuals}fonts/`);
        }
      }
    },
  };
}

export default defineConfig({
  root: demo,
  base,
  publicDir: false,
  plugins: [designDemo(), react()],
  resolve: { alias: [{ find: "@/lib/client", replacement: path.join(demo, "client.ts") }, { find: "@", replacement: root }] },
  css: { postcss: root },
  build: { outDir: path.join(root, "dist-demo"), assetsDir: "demo-assets", emptyOutDir: true, sourcemap: false },
});
