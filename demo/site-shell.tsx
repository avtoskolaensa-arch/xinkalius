import { ShoppingBag, MapPin } from "lucide-react";
import { LanguageSwitch, useI18n } from "@/components/language-provider";
import { Brand } from "@/components/brand";
import { translatedError } from "@/lib/i18n-core";
import type { Settings } from "@/lib/menu";
import { DemoNotice } from "./notice";

export function Header({ count = 0, onCart }: { count?: number; onCart?: () => void }) {
  const { t } = useI18n();
  return <><DemoNotice /><header className="site-header"><div className="shell header-inner"><Brand /><LanguageSwitch /><nav aria-label={t("მთავარი ნავიგაცია")}><a href="#menu">{t("მენიუ")}</a>{onCart && <button className="cart-button" onClick={onCart} aria-label={t("კალათა — {0} ცალი", { "0": count })}><ShoppingBag size={20} /><span>{t("კალათა")}</span><b>{count}</b></button>}</nav></div></header></>;
}

export function Footer({ settings }: { settings?: Settings }) {
  const { t } = useI18n();
  return <footer className="shell site-footer"><div><strong>{t("ხინკალიუსი")}</strong><p><MapPin size={16} /> {t("ბათუმი · გატანა და მიტანა")}</p></div><div><p>{settings?.notice || t("ფოტოები და ფასები საცდელია.")}</p></div></footer>;
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t, locale } = useI18n();
  return message ? <div role="alert" className="error-box">{translatedError(message, locale)}{onRetry && <button className="text-button" onClick={onRetry}>{t("ხელახლა ცდა")}</button>}</div> : null;
}

export function Loading() {
  const { t } = useI18n();
  return <div className="loading-state" role="status">{t("იტვირთება…")}</div>;
}
