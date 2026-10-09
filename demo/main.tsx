import { createRoot } from "react-dom/client";
import Storefront from "@/components/storefront";
import { LanguageProvider } from "@/components/language-provider";
import type { Locale } from "@/lib/menu";
import "@/app/globals.css";
import "./demo.css";

const saved = document.cookie.match(/(?:^|;\s*)xinkaliusi-language=(ka|en|ru)(?:;|$)/)?.[1];
const initialLocale: Locale = saved === "en" || saved === "ru" ? saved : "ka";
const container = document.getElementById("root");
if (!container) throw new Error("Missing demo root");
createRoot(container).render(<LanguageProvider initialLocale={initialLocale}><Storefront /></LanguageProvider>);
