import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "ხინკალიუსი — ხინკალი ბათუმში",
  description: "ხინკალიუსის შეკვეთის საცდელი ვერსია. აირჩიე შენი ხინკალი, გატანა ან მიტანა.",
  robots: { index: false, follow: false },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="ka"><body>{children}</body></html>;
}
