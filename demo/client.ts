import { useCallback, useMemo } from "react";
import { useI18n } from "@/components/language-provider";
import { localizedProduct, localizedSettings, translate } from "@/lib/i18n-core";
import { DEFAULT_SETTINGS, SAMPLE_PRODUCTS, type Locale, type Product, type ProductText } from "@/lib/menu";
import { demoCopy } from "./notice";

const fields = ["name", "description", "ingredients", "allergens"] as const;
const catalog = {
  products: SAMPLE_PRODUCTS.map(({ cost: _cost, ...sample }, index): Product => ({
    ...sample,
    id: `design-demo-${index + 1}`,
    updatedAt: 0,
    image: "/xinkalius/public/khinkali.png",
    translations: Object.fromEntries((["en", "ru"] as const).map(locale => [locale, Object.fromEntries(fields.map(field => [field, translate(sample[field], locale)])) as ProductText])) as Product["translations"],
  })),
  settings: structuredClone(DEFAULT_SETTINGS),
  workload: { units: 0, prepMinutes: DEFAULT_SETTINGS.prepMinutes },
};

function selectedLocale(): Locale {
  return document.documentElement.lang === "en" ? "en" : document.documentElement.lang === "ru" ? "ru" : "ka";
}

// This adapter intentionally has no fetch and no backend connection.
export async function api<T>(url: string, options?: RequestInit): Promise<T> {
  if (options?.signal?.aborted) throw new DOMException("Aborted", "AbortError");
  const method = options?.method?.toUpperCase() || "GET";
  if (method === "GET" && url === "/api/catalog") return structuredClone(catalog) as T;
  if (method === "GET" && url === "/api/orders") return { orders: [] } as T;
  throw new Error(demoCopy[selectedLocale()].unavailable);
}

export function useCatalog(_admin = false) {
  const { locale } = useI18n();
  const data = useMemo(() => ({ ...catalog, products: catalog.products.map(p => localizedProduct(p, locale)), settings: localizedSettings(catalog.settings, locale) }), [locale]);
  const load = useCallback(async () => structuredClone(catalog), []);
  return { data, error: "", load };
}
