"use client";
import {requestId} from "@/lib/request-id";
import {itemName,localizedProduct} from "@/lib/i18n-core";
import {useI18n} from "./language-provider";
import { useEffect, useRef, useState } from "react";
import { Plus, Minus, Trash2, Check, Banknote, CreditCard, ShoppingBag } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminShell, ErrorNote, Loading } from "./site-shell";
import { api, useCatalog } from "@/lib/client";
import { type Product, type Cart, type Order, CATEGORIES, money, PAYMENT_LABELS } from "@/lib/menu";
const KEY = "xinkaliusi-pos-v2";
export default function Pos() {
    const { t, locale } = useI18n();
    const { data, error: loadError, load } = useCatalog(true), [cart, setCart] = useState<Cart>({}), [method, setMethod] = useState("cash"), [name, setName] = useState(""), [note, setNote] = useState(""), [filter, setFilter] = useState("all"), [busy, setBusy] = useState(false), [error, setError] = useState(""), [receipt, setReceipt] = useState<Order | null>(null), [cash, setCash] = useState(""), [ready, setReady] = useState(false);
    const requestKey = useRef(""), guard = useRef(false);
    useEffect(() => { try {
        const d = JSON.parse(localStorage.getItem(KEY) || "null");
        if (d) {
            setCart(d.cart || {});
            setName(d.name || "");
            setNote(d.note || "");
            setMethod(d.method || "cash");
            requestKey.current = d.requestKey || "";
            if (d.orderId)
                void api<{
                    order: Order;
                }>(`/api/orders/${d.orderId}`).then(r => { setReceipt(r.order); setCash(String(r.order.total / 100)); }).catch(e => setError(e.message));
        }
    }
    catch { } setReady(true); }, []);
    useEffect(() => { if (ready)
        try {
            localStorage.setItem(KEY, JSON.stringify({ cart, name, note, method, requestKey: requestKey.current, orderId: receipt?.id }));
        }
        catch { } }, [cart, name, note, method, receipt, ready]);
    function qty(p: Product, n: number) { requestKey.current = ""; setCart(c => { const v = c[p.id] || 0, next = Math.min(200, v === 0 && n > 0 ? p.minQuantity : v + n), copy = { ...c }; if (next < p.minQuantity)
        delete copy[p.id];
    else
        copy[p.id] = next; return copy; }); }
    const products = (data?.products || []).map(p=>localizedProduct(p,locale)), selected = products.filter(p => cart[p.id]), total = selected.reduce((s, p) => s + p.price * cart[p.id], 0), invalid = selected.some(p => !p.available || cart[p.id] < p.minQuantity) || Object.keys(cart).some(id => !products.some(p => p.id === id));
    async function create() { if (guard.current || !selected.length)
        return; guard.current = true; setBusy(true); setError(""); requestKey.current ||= requestId(); try {
        localStorage.setItem(KEY, JSON.stringify({ cart, name, note, method, requestKey: requestKey.current }));
    }
    catch { } try {
        const r = await api<{
            order: Order;
        }>("/api/orders", { method: "POST", body: JSON.stringify({ requestKey: requestKey.current, name, phone: "", address: "", note, fulfillment: "pickup", paymentMethod: method, source: "pos", expectedTotal: total, items: selected.map(p => ({ id: p.id, quantity: cart[p.id] })) }) });
        setReceipt(r.order);
        setCash(String(total / 100));
    }
    catch (e) {
        setError((e as Error).message);
        await load();
    }
    finally {
        guard.current = false;
        setBusy(false);
    } }
    async function collect() { if (!receipt || guard.current)
        return; guard.current = true; setBusy(true); setError(""); try {
        const r = await api<{
            order: Order;
        }>(`/api/orders/${receipt.id}`, { method: "PATCH", body: JSON.stringify({ action: "collect", cashReceived: Math.round(Number(cash) * 100) }) });
        setReceipt(r.order);
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        guard.current = false;
        setBusy(false);
    } }
    function reset() { setReceipt(null); setCart({}); setName(""); setNote(""); setCash(""); setError(""); requestKey.current = ""; }
    return <AdminShell active="/admin/pos"><div className="page-heading"><div><p className="eyebrow">{t("ადგილზე გასატანი შეკვეთა")}</p><h1>{t("სწრაფი სალარო")}</h1><p>{t("აირჩიე პროდუქტები და გაუგზავნე სამზარეულოს.")}</p><a className="text-button" href="/admin/shifts">{t("ნაღდის მიღებამდე გახსენი სალაროს ცვლა")}</a></div></div><ErrorNote message={loadError} onRetry={() => void load()}/>{!data ? <Loading /> : <div className="pos-layout"><section><Tabs value={filter} onValueChange={setFilter}><TabsList className="menu-tabs"><TabsTrigger value="all">{t("ყველა")}</TabsTrigger>{Object.entries(CATEGORIES).filter(([c]) => products.some(p => p.category === c)).map(([c, l]) => <TabsTrigger key={c} value={c}>{t(l)}</TabsTrigger>)}</TabsList></Tabs><div className="pos-products">{products.filter(p => filter === "all" || p.category === filter).map(p => <button key={p.id} className="pos-product" disabled={!p.available || busy || !!receipt} onClick={() => qty(p, 1)}>{p.image ? <img src={p.image} alt="" width="160" height="110"/> : <ShoppingBag size={35}/>}<strong>{itemName(p,locale)}</strong><span>{money(p.price)}{" " + t("/ ცალი") + ""}</span><small>{p.available ? t("მინ. {0} ცალი", { "0": p.minQuantity }) : t("ამოიწურა")}</small><Plus size={18}/></button>)}</div></section><aside className="pos-receipt"><h2>{receipt ? t("შეკვეთა #{0}", { "0": receipt.id.slice(0, 8).toUpperCase() }) : t("ახალი შეკვეთა")}</h2>{receipt ? <><p className="saved-note"><Check size={18}/>{" " + t("სამზარეულოში გაგზავნილია") + ""}</p><div className="order-lines">{receipt.items.map(i => <div key={i.id}><span>{i.quantity} × {itemName(i,locale)}</span><strong>{money(i.price * i.quantity)}</strong></div>)}</div><div className="receipt-total"><span>{t("სულ")}</span><strong>{money(receipt.total)}</strong></div><p className="notice">{t(PAYMENT_LABELS[receipt.payment_status])}</p>{["cash_due", "terminal_due"].includes(receipt.payment_status) && receipt.status !== "cancelled" ? <>{receipt.payment_method === "cash" ? <><label className="field">{t("მიღებული თანხა ₾")}<input type="number" min={receipt.total / 100} step="0.01" value={cash} onChange={e => setCash(e.target.value)}/></label><div className="change-due"><span>{t("ხურდა")}</span><strong>{money(Math.max(0, Math.round(Number(cash) * 100) - receipt.total))}</strong></div></> : <p className="small-note">{t("ტერმინალი ავტომატურად დაკავშირებული არ არის. წარმატებული ოპერაცია ხელით დაადასტურე.")}</p>}<button className="primary full" disabled={busy || (receipt.payment_method === "cash" && Math.round(Number(cash) * 100) < receipt.total)} onClick={() => void collect()}>{busy ? t("ინახება…") : t("გადახდა მიღებულია")}</button></> : <p className="saved-note"><Check size={18}/> {receipt.status === "cancelled" ? t("შეკვეთა გაუქმებულია") : t("აღრიცხვა დასრულებულია")}</p>}<ErrorNote message={error}/><button className="secondary full" disabled={busy} onClick={reset}>{t("ახალი შეკვეთა")}</button><a className="text-button" href="/admin">{t("სამზარეულოს ნახვა")}</a></> : <><div className="pos-lines">{selected.length ? selected.map(p => <div className="basket-line" key={p.id}><div><strong>{itemName(p,locale)}</strong><div className="stepper small"><button disabled={busy} onClick={() => qty(p, -1)} aria-label={t("{0}: შემცირება", { "0": itemName(p,locale) })}><Minus size={16}/></button><span>{cart[p.id]}</span><button disabled={busy || cart[p.id] >= 200} onClick={() => qty(p, 1)} aria-label={t("{0}: დამატება", { "0": itemName(p,locale) })}><Plus size={16}/></button></div></div><div className="line-right"><strong>{money(p.price * cart[p.id])}</strong><button className="icon-button" disabled={busy} aria-label={t("{0}: წაშლა", { "0": itemName(p,locale) })} onClick={() => { const c = { ...cart }; delete c[p.id]; requestKey.current = ""; setCart(c); }}><Trash2 size={16}/></button></div></div>) : <div className="empty-basket"><ShoppingBag size={36}/><p>{t("დაამატე პროდუქტი მარცხენა მენიუდან.")}</p></div>}</div><label className="field">{"" + t("სახელი ან შენიშვნა") + " "}<span>{t("არასავალდებულო")}</span><input maxLength={80} disabled={busy} value={name} onChange={e => { setName(e.target.value); requestKey.current = ""; }} placeholder={t("მაგ.: სტუმარი წითელი ქურთუკით")}/></label><label className="field">{t("კომენტარი სამზარეულოსთვის")}<textarea maxLength={500} disabled={busy} value={note} onChange={e => { setNote(e.target.value); requestKey.current = ""; }}/></label><Tabs value={method} onValueChange={v => { setMethod(v); requestKey.current = ""; }}><TabsList className="fulfillment-tabs"><TabsTrigger value="cash" disabled={busy}><Banknote size={17}/>{" " + t("ნაღდი") + ""}</TabsTrigger><TabsTrigger value="terminal" disabled={busy}><CreditCard size={17}/>{" " + t("ტერმინალი") + ""}</TabsTrigger></TabsList></Tabs><div className="receipt-total"><span>{t("სულ")}</span><strong>{money(total)}</strong></div><ErrorNote message={error || (invalid ? t("პროდუქტის ხელმისაწვდომობა შეიცვალა. გადაამოწმე კალათა.") : "")}/><button className="primary full" disabled={busy || !selected.length || invalid} onClick={() => void create()}>{busy ? t("იგზავნება…") : t("სამზარეულოში გაგზავნა")}</button></>}<p className="small-note">{t("საცდელი სალაროა. თანხას არ იღებს და ფისკალურ ჩეკს არ გასცემს.")}</p></aside></div>}</AdminShell>;
}
