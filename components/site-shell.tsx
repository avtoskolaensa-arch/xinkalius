"use client";
import {useI18n} from "./language-provider";
import { LanguageSwitch } from "./language-provider";
import { translatedError } from "@/lib/i18n-core";
import { ShoppingBag, MapPin, ChefHat, ClipboardList, Store, Package, Settings, Utensils, BarChart3, Receipt, Banknote } from "lucide-react";
import { Brand, DemoBanner } from "./brand";
import { type Settings as StoreSettings } from "@/lib/menu";
export function Header({ count, onCart }: {
    count?: number;
    onCart?: () => void;
}) { const { t, locale } = useI18n(); return <><DemoBanner /><header className="site-header"><div className="shell header-inner"><Brand /><LanguageSwitch /><nav aria-label={t("მთავარი ნავიგაცია")}><a href="/#menu">{t("მენიუ")}</a><a href="/orders" aria-label={t("ჩემი შეკვეთები")} className="orders-link"><ClipboardList size={18}/><span>{t("ჩემი შეკვეთები")}</span></a>{onCart && <button className="cart-button" onClick={onCart} aria-label={t("კალათა — {0} ცალი", { "0": count || 0 })}><ShoppingBag size={20}/><span>{t("კალათა")}</span><b>{count || 0}</b></button>}</nav></div></header></>; }
export function Footer({ settings }: {
    settings?: StoreSettings;
}) { const { t, locale } = useI18n(); return <footer className="shell site-footer"><div><strong>{t("ხინკალიუსი")}</strong><p><MapPin size={16}/>{" " + t("ბათუმი · გატანა და მიტანა") + ""}</p></div><div>{settings?.address && <p>{settings.address}</p>}{settings?.phone && <a href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`}>{settings.phone}</a>}<p>{t("ფოტოები და ფასები საცდელია.")}</p></div><a className="staff-link" href="/admin"><ChefHat size={17}/>{" " + t("თანამშრომლის სივრცე") + ""}</a></footer>; }
const adminLinks = [{ href: "/admin", label: "შეკვეთები", icon: ChefHat }, { href: "/admin/products", label: "პროდუქტები", icon: Package }, { href: "/admin/pos", label: "სწრაფი სალარო", icon: Store }, { href: "/admin/statistics", label: "სტატისტიკა", icon: BarChart3 }, { href: "/admin/expenses", label: "ხარჯები", icon: Receipt }, { href: "/admin/shifts", label: "სალაროს ცვლები", icon: Banknote }, { href: "/admin/settings", label: "პარამეტრები", icon: Settings }];
export function AdminShell({ active, children }: {
    active: string;
    children: React.ReactNode;
}) { const { t, locale } = useI18n(); return <><DemoBanner /><header className="admin-header"><div className="shell header-inner"><Brand /><LanguageSwitch /><a className="secondary" href="/"><Utensils size={17}/>{" " + t("საიტის ნახვა") + ""}</a></div></header><div className="admin-nav"><nav className="shell" aria-label={t("მართვის მენიუ")}>{adminLinks.map(l => <a key={l.href} href={l.href} aria-current={active === l.href ? "page" : undefined} className={active === l.href ? "active" : ""}><l.icon size={19}/>{t(l.label)}</a>)}</nav></div><main className="shell admin-main">{children}</main></>; }
export function ErrorNote({ message, onRetry }: {
    message: string;
    onRetry?: () => void;
}) { const { t, locale } = useI18n(); if (!message)
    return null; return <div role="alert" className="error-box">{translatedError(message, locale)}{onRetry && <button className="text-button" onClick={onRetry}>{t("ხელახლა ცდა")}</button>}</div>; }
export function Loading() { const { t, locale } = useI18n(); return <div className="loading-state" role="status">{t("იტვირთება…")}</div>; }
