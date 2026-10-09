import {translate} from "@/lib/i18n-core";
import {cookies} from "next/headers";
import {LanguageProvider} from "@/components/language-provider";
import type {Locale} from "@/lib/menu";
import type { Metadata } from "next";
import "./globals.css";
export async function generateMetadata():Promise<Metadata>{const value=(await cookies()).get("xinkaliusi-language")?.value;const locale:Locale=value==="en"||value==="ru"?value:"ka";return {
  title: translate("ხინკალიუსი — ხინკალი ბათუმში",locale),
  description: translate("ხინკალიუსის შეკვეთის საცდელი ვერსია. აირჩიე შენი ხინკალი, გატანა ან მიტანა.",locale),
  robots: { index: false, follow: false },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};}
export default async function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  const value=(await cookies()).get("xinkaliusi-language")?.value;const locale:Locale=value==="en"||value==="ru"?value:"ka";
  return <html lang={locale}><head><link rel="preload" href="/fonts/bpg-nino-mtavruli-bold.woff" as="font" type="font/woff" crossOrigin="anonymous"/><link rel="preload" href="/fonts/3d-unicode.woff" as="font" type="font/woff" crossOrigin="anonymous"/></head><body className={`locale-${locale}`}><LanguageProvider initialLocale={locale}>{children}</LanguageProvider></body></html>;
}
