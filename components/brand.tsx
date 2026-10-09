"use client";
import {useI18n} from "./language-provider";
export function DemoBanner() { const { t, locale } = useI18n(); return <div className="demo-banner">{t("საცდელი სივრცე · შეკვეთები სატესტოა · თანხა არ ჩამოგეჭრება")}</div>; }
export function Brand() { const { t, locale } = useI18n(); return <a href="/" className="brand" aria-label={t("ხინკალიუსი — მთავარი")}><span className="wordmark"><img src="/approved-brand.png" width="1239" height="1285" alt={t("ხინკალიუსი")}/></span></a>; }
