"use client";
import {requestId} from "@/lib/request-id";
import {itemName} from "@/lib/i18n-core";
import {useI18n} from "./language-provider";
import { DeliveryMap } from "./delivery-map";
import { deliveryZone, preparation, reconcileOrder } from "@/lib/operations";
import type { Point } from "@/lib/menu";
import { useCallback, useEffect, useRef, useState } from "react";
import { Minus, Plus, ShoppingBag, Truck, Store, Clock, Trash2, CreditCard, Check, Info, Phone } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Header, Footer, ErrorNote, Loading } from "./site-shell";
import { MascotHero } from "./mascot-hero";
import { api, useCatalog } from "@/lib/client";
import { CATEGORIES, money, isOpen, type Product, type Cart, type Order } from "@/lib/menu";
const STORAGE = "xinkaliusi-checkout-v2";
type Draft = {
    cart: Cart;
    name: string;
    phone: string;
    address: string;
    note: string;
    fulfillment: "delivery" | "pickup";
    requestKey: string;
    point: Point | null;
};
const EMPTY: Draft = { cart: {}, name: "", phone: "", address: "", note: "", fulfillment: "delivery", requestKey: "", point: null };
export default function Storefront() {
    const { t, locale } = useI18n();
    const { data, error: loadError, load } = useCatalog();
    const [draft, setDraft] = useState<Draft>(EMPTY), [loaded, setLoaded] = useState(false), [filter, setFilter] = useState("all"), [sheet, setSheet] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(""), [order, setOrder] = useState<Order | null>(null), [detailId, setDetailId] = useState<string | null>(null), [deliveryInfo, setDeliveryInfo] = useState(false);
    const busyRef = useRef(false);
    const [repeat, setRepeat] = useState<ReturnType<typeof reconcileOrder> | null>(null), [repeatMessage, setRepeatMessage] = useState(""), [lastOrder, setLastOrder] = useState<Order | null>(null);
    const repeatSeen = useRef(false);
    useEffect(() => { void api<{
        orders: Order[];
    }>("/api/orders").then(r => setLastOrder(r.orders[0] ?? null)).catch(() => { }); }, []);
    async function prepareRepeat(id: string) { try {
        const [r, c] = await Promise.all([api<{
                order: Order;
            }>(`/api/orders/${encodeURIComponent(id)}`), load()]);
        if (!c)
            return;
        const result = reconcileOrder(r.order.items, c.products);
        setRepeat(result);
        setRepeatMessage("");
    }
    catch (e) {
        setRepeatMessage((e as Error).message);
    } }
    useEffect(() => { if (!loaded || !data || repeatSeen.current)
        return; repeatSeen.current = true; const id = new URLSearchParams(location.search).get("reorder"); if (id)
        void prepareRepeat(id); }, [loaded, data]);
    useEffect(() => { try {
        const d = JSON.parse(localStorage.getItem(STORAGE) || "null");
        if (d && typeof d.cart === "object") {
            const cart: Cart = {};
            for (const [id, n] of Object.entries(d.cart))
                if (Number.isInteger(n) && Number(n) > 0 && Number(n) <= 200)
                    cart[id] = Number(n);
            setDraft({ ...EMPTY, ...d, cart });
        }
    }
    catch { } setLoaded(true); }, []);
    useEffect(() => { if (loaded)
        try {
            localStorage.setItem(STORAGE, JSON.stringify(draft));
        }
        catch { } }, [draft, loaded]);
    const change = useCallback((key: keyof Draft, value: Draft[keyof Draft]) => { setDraft(d => ({ ...d, [key]: value, requestKey: "" })); setError(""); setOrder(null); }, []);
    const changeQty = useCallback((p: Product, n: number) => { setDraft(d => { const qty = d.cart[p.id] || 0, next = Math.min(200, qty === 0 && n > 0 ? p.minQuantity : qty + n), cart = { ...d.cart }; if (next < p.minQuantity)
        delete cart[p.id];
    else
        cart[p.id] = next; return { ...d, cart, requestKey: "" }; }); setOrder(null); setError(""); }, []);
    useEffect(() => { if (!data)
        return; const context = (document as Document & {
        modelContext?: {
            registerTool: (tool: unknown, options: unknown) => unknown;
        };
    }).modelContext; if (!context?.registerTool)
        return; const c = new AbortController(); try {
        Promise.resolve(context.registerTool({ name: "set_khinkali_cart", title: t("ხინკლის არჩევა"), description: "Stage a test cart only; never places an order or takes payment.", inputSchema: { type: "object", properties: { items: { type: "array", items: { type: "object", properties: { id: { type: "string" }, quantity: { type: "integer", minimum: 1, maximum: 200 } }, required: ["id", "quantity"] } } }, required: ["items"] }, execute: async (v: {
                items: {
                    id: string;
                    quantity: number;
                }[];
            }) => { if (!Array.isArray(v.items) || v.items.length > 100 || new Set(v.items.map(i => i.id)).size !== v.items.length || v.items.some(i => { const p = data.products.find(p => p.id === i.id); return !p?.available || !Number.isInteger(i.quantity) || i.quantity < p.minQuantity || i.quantity > 200; }))
                throw new Error("Invalid cart"); change("cart", Object.fromEntries(v.items.map(i => [i.id, i.quantity]))); return { placed: false }; } }, { signal: c.signal })).catch(() => { });
    }
    catch { } return () => c.abort(); }, [data, change]);
    if (!data)
        return <><Header /><main className="shell"><ErrorNote message={loadError} onRetry={() => void load()}/>{!loadError ? <Loading /> : <a className="primary" href="/signin-with-chatgpt?return_to=%2F" target="_top">{t("საცდელ სივრცეში შესვლა")}</a>}</main></>;
    const { products, settings } = data,detail=products.find(p=>p.id===detailId)??null, selected = products.filter(p => draft.cart[p.id]), count = Object.values(draft.cart).reduce((s, q) => s + q, 0), subtotal = selected.reduce((s, p) => s + p.price * draft.cart[p.id], 0), zone = deliveryZone(draft.point, settings.zones), fee = draft.fulfillment === "delivery" ? (zone?.fee ?? 0) : 0, prep = preparation(settings, data.workload.units, selected.filter(p => p.category === "khinkali").reduce((sum, p) => sum + draft.cart[p.id], 0)), total = subtotal + fee, open = isOpen(settings), invalid = selected.some(p => !p.available || draft.cart[p.id] < p.minQuantity) || Object.keys(draft.cart).some(id => !products.some(p => p.id === id));
    function remove(id: string) { const cart = { ...draft.cart }; delete cart[id]; change("cart", cart); }
    function lines() { return <>{selected.map(p => <div className="basket-line" key={p.id}><div><strong>{p.name}</strong><span>{money(p.price)}{" " + t("/ ცალი") + ""}{!p.available && t(" · ამოიწურა")}</span><div className="stepper small"><button type="button" disabled={busy} onClick={() => changeQty(p, -1)} aria-label={t("{0}: შემცირება", { "0": p.name })}><Minus size={16}/></button><span>{draft.cart[p.id]}</span><button type="button" disabled={busy || draft.cart[p.id] >= 200 || !p.available} onClick={() => changeQty(p, 1)} aria-label={t("{0}: დამატება", { "0": p.name })}><Plus size={16}/></button></div></div><div className="line-right"><strong>{money(p.price * draft.cart[p.id])}</strong><button type="button" className="icon-button" disabled={busy} onClick={() => remove(p.id)} aria-label={t("{0}: წაშლა", { "0": p.name })}><Trash2 size={17}/></button></div></div>)}{Object.keys(draft.cart).filter(id => !products.some(p => p.id === id)).map(id => <div className="error-box" key={id}>{t("პროდუქტი აღარ არის მენიუში.")}<button onClick={() => remove(id)} type="button">{t("წაშლა")}</button></div>)}</>; }
    function totals() { return <div className="totals"><div><span>{t("პროდუქტები")}</span><span>{money(subtotal)}</span></div><div><span>{draft.fulfillment === "delivery" ? t("მიტანა") : t("ადგილზე გატანა")}</span><span>{draft.fulfillment==="delivery"&&!zone?t("აირჩიე მისამართი"):money(fee)}</span></div><div className="grand-total"><strong>{t("სულ")}</strong><strong>{draft.fulfillment==="delivery"&&!zone?t("მისამართის არჩევის შემდეგ"):money(total)}</strong></div></div>; }
    function fulfillment() { return <Tabs value={draft.fulfillment} onValueChange={v => change("fulfillment", v as Draft["fulfillment"])}><TabsList className="fulfillment-tabs"><TabsTrigger value="delivery" disabled={busy}><Truck size={17}/>{" " + t("მიტანა") + ""}</TabsTrigger><TabsTrigger value="pickup" disabled={busy}><Store size={17}/>{" " + t("მე გავიტან") + ""}</TabsTrigger></TabsList></Tabs>; }
    async function submit(e: React.FormEvent) {
        e.preventDefault();
        if (busyRef.current || !count || invalid)
            return;
        busyRef.current = true;
        setBusy(true);
        setError("");
        let requestKey = draft.requestKey || requestId();
        const saved = { ...draft, requestKey };
        setDraft(saved);
        try {
            localStorage.setItem(STORAGE, JSON.stringify(saved));
        }
        catch { }
        try {
            const r = await api<{
                order: Order;
            }>("/api/orders", { method: "POST", body: JSON.stringify({ requestKey, name: draft.name, phone: draft.phone, address: draft.address, note: draft.note, fulfillment: draft.fulfillment, paymentMethod: "cash", source: "web", point: draft.fulfillment === "delivery" ? draft.point : null, expectedTotal: total, items: selected.map(p => ({ id: p.id, quantity: draft.cart[p.id] })) }) });
            setOrder(r.order);
            setLastOrder(r.order);
            setDraft({ ...draft, cart: {}, requestKey: "" });
            try {
                localStorage.setItem("xinkaliusi-last-order", r.order.id);
            }
            catch { }
        }
        catch (e) {
            setError((e as Error).message);
            await load();
        }
        finally {
            busyRef.current = false;
            setBusy(false);
        }
    }
    return <><Header count={count} onCart={() => setSheet(true)}/><MascotHero /><div className="shell service-strip"><span className={open ? "open-label" : "closed-label"}><Clock size={17}/>{open ? t("მომზადება ~{0} წთ", { "0": prep }) : `შეკვეთები შეჩერებულია`}</span><button onClick={() => setDeliveryInfo(true)}><Truck size={17}/>{" " + t("მიტანის ზონები") + ""}</button><span><Store size={17}/>{" " + t("ადგილზე გატანა") + ""}</span></div>
 <div className="shell repeat-shortcut">{lastOrder && <button className="secondary" onClick={() => void prepareRepeat(lastOrder.id)}>{t("ჩემი ჩვეულებრივი · გაიმეორე ბოლო შეკვეთა")}</button>}<ErrorNote message={repeatMessage}/></div><main className="shell ordering-layout" id="menu"><section className="menu-section"><div className="section-heading"><div><span className="eyebrow">{t("კარგი არჩევანი იწყება აქ")}</span><h2>{t("შენი ხინკალი")}</h2></div><span className="muted small">{t("ფასი / ცალი")}</span></div><Tabs value={filter} onValueChange={setFilter}><TabsList className="menu-tabs"><TabsTrigger value="all">{t("ყველა")}</TabsTrigger>{Object.entries(CATEGORIES).filter(([c]) => products.some(p => p.category === c)).map(([c, l]) => <TabsTrigger key={c} value={c}>{t(l)}</TabsTrigger>)}</TabsList></Tabs><ErrorNote message={loadError} onRetry={() => void load()}/>{!open && <div className="notice">{t("ახლა შეკვეთებს არ ვიღებთ.")}{settings.enforceHours && t(" სამუშაო საათები: {0}–{1}.", { "0": settings.openTime, "1": settings.closeTime })}</div>}<div className="menu-grid">{products.filter(p => filter === "all" || p.category === filter).map(p => <article className={`menu-card ${!p.available ? "sold-out" : ""}`} key={p.id}><button className="product-photo" onClick={() => setDetailId(p.id)} aria-label={t("{0}: შემადგენლობა", { "0": p.name })}>{p.image ? <img src={p.image} alt={p.name} width="400" height="300" loading="lazy"/> : <ShoppingBag size={42}/>}<span className="food-tag">{p.available ? t("მინ. {0} ცალი", { "0": p.minQuantity }) : t("ამოიწურა")}</span></button><div className="product-copy"><button className="product-title" onClick={() => setDetailId(p.id)}><h3>{p.name}</h3></button><p>{p.description}</p><div className="card-bottom"><div className="price"><strong>{money(p.price)}</strong><button className="info-link" onClick={() => setDetailId(p.id)}><Info size={13}/>{" " + t("შემადგენლობა") + ""}</button></div>{draft.cart[p.id] ? <div className="stepper"><button disabled={busy} onClick={() => changeQty(p, -1)} aria-label={t("{0}: შემცირება", { "0": p.name })}><Minus size={18}/></button><span>{draft.cart[p.id]}</span><button disabled={!p.available || busy || draft.cart[p.id] >= 200} onClick={() => changeQty(p, 1)} aria-label={t("{0}: დამატება", { "0": p.name })}><Plus size={18}/></button></div> : <button className="add-button" aria-label={t("{0}: დამატება",{"0":p.name})} disabled={!p.available || !open || busy} onClick={() => changeQty(p, 1)}><Plus size={20}/><span>{t("დამატება")}</span></button>}</div><div className="quantity-shortcuts">{[p.minQuantity, p.minQuantity * 2, p.minQuantity * 3].filter(n => n <= 200).map(n => <button key={n} disabled={!p.available || !open || busy} onClick={() => change("cart", { ...draft.cart, [p.id]: n })}>{n}{" " + t("ცალი") + ""}</button>)}</div></div></article>)}</div><p className="menu-note">{settings.notice}{" " + t("ალერგენების ინფორმაცია პროდუქტის ბარათზეა.") + ""}</p></section>
 <aside className="basket"><div className="basket-heading"><h2>{t("შენი კალათა")}</h2><ShoppingBag size={22}/></div>{fulfillment()}{count ? <>{lines()}{totals()}<button className="primary full" disabled={!open || invalid} onClick={() => setSheet(true)}>{t("შეკვეთის გაფორმება")}</button>{invalid && <p className="error-box">{t("გადაამოწმე ამოწურული პროდუქტი ან მინიმალური რაოდენობა.")}</p>}</> : <div className="empty-basket"><ShoppingBag size={40}/><h3>{t("აქ გემრიელი ამბავი იწყება")}</h3><p>{t("აირჩიე ხინკალი და დაამატე კალათაში.")}</p></div>}<p className="basket-note"><Clock size={15}/> {draft.fulfillment === "delivery" ? (zone?t("მომზადება და მიტანა ~{0} წთ", { "0": prep + zone.minutes }):t("აირჩიე მისამართი დროის დასათვლელად")) : t("მზად იქნება ~{0} წუთში", { "0": prep })}</p></aside></main><Footer settings={settings}/>{count > 0 && <button className="mobile-basket primary" onClick={() => setSheet(true)}><ShoppingBag size={21}/><span>{"" + t("კალათა ·") + " "}{count}{" " + t("ცალი") + ""}</span><strong>{money(total)}</strong></button>}
 <Sheet open={sheet} onOpenChange={v => { if (!busy)
        setSheet(v); }}><SheetContent className="checkout-sheet"><SheetHeader><SheetTitle>{order ? t("შეკვეთა მიღებულია") : t("შენი შეკვეთა")}</SheetTitle><SheetDescription>{order ? t("საცდელი შეკვეთა შენახულია.") : t("გადაამოწმე არჩევანი და შეავსე საკონტაქტო ინფორმაცია.")}</SheetDescription></SheetHeader><div className="checkout-body">{order ? <div className="success-state"><div className="success-icon"><Check size={34}/></div><h2>{t("შევხვდებით ხინკალთან!")}</h2><strong>#{order.id.slice(0, 8).toUpperCase()}</strong><p>{"" + t("დაახლოებით") + " "}{order.prep_minutes}{" " + t("წუთი ·") + " "}{money(order.total)}</p><p>{t("საცდელი შეკვეთაა — თანხა არ ჩამოგჭრია.")}</p><a className="primary full" href={`/orders#${order.id}`}>{t("შეკვეთის სტატუსი")}</a><button className="secondary full" onClick={() => { setSheet(false); setOrder(null); }}>{t("მენიუში დაბრუნება")}</button></div> : count ? <form onSubmit={submit}><fieldset disabled={busy}>{fulfillment()}{lines()}<div className="form-grid"><label className="field">{t("სახელი")}<input required minLength={2} maxLength={80} autoComplete="given-name" value={draft.name} onChange={e => change("name", e.target.value)} placeholder={t("შენი სახელი")}/></label><label className="field">{t("ტელეფონი")}<input required type="tel" autoComplete="tel" value={draft.phone} maxLength={30} onChange={e => change("phone", e.target.value)} placeholder="+995 5XX XX XX XX"/></label></div>{draft.fulfillment === "delivery" ? <><DeliveryMap point={draft.point} onChange={p => {if(!busyRef.current)change("point", p);}} zones={settings.zones}/>{zone ? <p className="notice">{zone.name} · {money(zone.fee)} · {zone.minutes}{" " + t("წთ გზაში") + ""}</p> : <p className="notice">{draft.point ? t("ამ წერტილზე მიტანა არ არის. გადაადგილე პინი ან აირჩიე გატანა.") : t("მონიშნე მისამართი, რომ მიტანის ფასი და დრო გაიგო.")}</p>}<label className="field">{t("მიტანის მისამართი")}<textarea required minLength={5} maxLength={250} autoComplete="street-address" value={draft.address} onChange={e => change("address", e.target.value)} placeholder={t("ქუჩა, ნომერი, სადარბაზო, სართული")}/></label></> : <div className="notice"><Store size={18}/> {settings.address || t("გატანის მისამართი ჯერ დასაზუსტებელია — ეს საცდელი შეკვეთაა.")}</div>}<label className="field">{"" + t("კომენტარი") + " "}<span>{t("არასავალდებულო")}</span><textarea maxLength={500} value={draft.note} onChange={e => change("note", e.target.value)} placeholder={t("მაგალითად: ხურდა მჭირდება 50 ₾-დან")}/></label><div className="payment-choice"><Check size={20}/><div><strong>{t("ნაღდი ანგარიშსწორება")}</strong><p>{draft.fulfillment === "delivery" ? t("მიღებისას კურიერთან") : t("ადგილზე გატანისას")}</p></div></div><div className="disabled-payment"><CreditCard size={20}/><span>{t("ბარათი და ციფრული საფულეები ბანკის ჩართვის შემდეგ დაემატება.")}</span></div>{totals()}{invalid && <ErrorNote message={t("კალათაში მიუწვდომელი პროდუქტი ან არასწორი რაოდენობაა.")}/>}<ErrorNote message={error}/><button className="primary full" type="submit" disabled={!open || invalid || busy || subtotal < Math.max(settings.minimumOrder, draft.fulfillment === "delivery" ? zone?.minimum ?? 0 : 0) || (draft.fulfillment === "delivery" && !zone)}>{busy ? t("ინახება…") : t("საცდელი შეკვეთის გაგზავნა")}</button>{subtotal < Math.max(settings.minimumOrder, draft.fulfillment === "delivery" ? zone?.minimum ?? 0 : 0) && <p className="error-box">{"" + t("მინიმალური შეკვეთა:") + " "}{money(Math.max(settings.minimumOrder, draft.fulfillment === "delivery" ? zone?.minimum ?? 0 : 0))}</p>}<p className="small-note">{t("თანხა არ ჩამოგეჭრება. ტესტისთვის გამოიყენე გამოგონილი მონაცემები. სტატუსს „ჩემი შეკვეთებიდან“ ნახავ.")}</p></fieldset></form> : <div className="empty-basket"><ShoppingBag size={40}/><h3>{t("კალათა ცარიელია")}</h3><button className="primary" onClick={() => setSheet(false)}>{t("მენიუში დაბრუნება")}</button></div>}</div></SheetContent></Sheet>
 <Dialog open={!!detail} onOpenChange={v => !v && setDetailId(null)}><DialogContent className="product-dialog"><DialogHeader><DialogTitle>{detail?.name}</DialogTitle><DialogDescription>{detail?.description}</DialogDescription></DialogHeader>{detail?.image && <img src={detail.image} alt={detail.name} className="detail-photo"/>}<div><strong>{t("შემადგენლობა")}</strong><p>{detail?.ingredients || t("ინფორმაცია დაემატება.")}</p></div><div className="notice"><strong>{"" + t("ალერგენები:") + " "}</strong>{detail?.allergens || t("ინფორმაცია დაზუსტების პროცესშია.")}</div><p>{detail && money(detail.price)}{" " + t("/ ცალი · მინიმუმ") + " "}{detail?.minQuantity}{" " + t("ცალი") + ""}</p><p className="small-note">{t("საცდელი მენიუ — შემადგენლობა და ფოტო საილუსტრაციოა.")}</p></DialogContent></Dialog>
 <Dialog open={deliveryInfo} onOpenChange={setDeliveryInfo}><DialogContent><DialogHeader><DialogTitle>{t("მიტანა და გატანა")}</DialogTitle><DialogDescription>{settings.deliveryArea}</DialogDescription></DialogHeader><div>{settings.zones.filter(z=>z.enabled).map(z=><p key={z.id}>{z.name} · {money(z.fee)} · {z.minutes} {t("წთ გზაში")} · {t("მინ.")} {money(z.minimum)}</p>)}</div><p>{"" + t("გატანა:") + " "}{settings.address || t("მისამართი დაემატება")}</p><p>{"" + t("საათები:") + " "}{settings.openTime}–{settings.closeTime}</p>{settings.phone && <a className="secondary" href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`}><Phone size={18}/> {settings.phone}</a>}<p className="small-note">{t("სატესტო ზონები. საბოლოო ფასი მისამართის მონიშვნისას გამოჩნდება.")}</p></DialogContent></Dialog><Dialog open={!!repeat} onOpenChange={v => !v && setRepeat(null)}><DialogContent><DialogHeader><DialogTitle>{t("შეკვეთის გამეორება")}</DialogTitle><DialogDescription>{t("კალათაში გადავა ხელმისაწვდომი პროდუქტი მიმდინარე ფასებით. შეკვეთა ავტომატურად არ იგზავნება.")}</DialogDescription></DialogHeader>{repeat && <><ul>{Object.entries(repeat.cart).map(([id, n]) => <li key={id}>{products.find(p => p.id === id)?.name} × {n}</li>)}</ul>{repeat.changes.map((c, i) => <p className="notice" key={i}>{itemName(c,locale)}: {{ missing: t("აღარ არის მენიუში"), unavailable: t("ამოიწურა"), minimum: t("რაოდენობა გაზრდილია ახალ მინიმუმამდე"), price: t("ფასი შეიცვალა"), quantity: t("რაოდენობა არასწორია") }[c.reason]}</p>)}{count > 0 && <p className="notice">{t("არსებული კალათა შეიცვლება ამ არჩევანით.")}</p>}{!Object.keys(repeat.cart).length && <p>{t("შესაკვეთად ხელმისაწვდომი პროდუქტი არ დარჩა. შენი კალათა შენარჩუნებულია.")}</p>}<button className="primary full" disabled={!Object.keys(repeat.cart).length} onClick={() => { change("cart", repeat.cart); setRepeat(null); setSheet(true); history.replaceState(null, "", location.pathname + location.hash); }}>{t("კალათაში გადატანა და გადამოწმება")}</button></>}</DialogContent></Dialog></>;
}
