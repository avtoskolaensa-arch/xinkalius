"use client";
import {itemName,localizedProduct} from "@/lib/i18n-core";
import {useI18n} from "./language-provider";
import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, Bell, BellOff, ChefHat, Clock, Check, Banknote, CreditCard, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { AdminShell, ErrorNote, Loading } from "./site-shell";
import { api } from "@/lib/client";
import { type Order, money, STATUS_LABELS, PAYMENT_LABELS, nextStatus } from "@/lib/menu";
type Summary = {
    today_count: number;
    cash: number;
    terminal: number;
    active: number;
};
export default function Kitchen() {
    const { t, locale } = useI18n();
    const [orders, setOrders] = useState<Order[] | null>(null), [summary, setSummary] = useState<Summary | null>(null), [filter, setFilter] = useState("active"), [error, setError] = useState(""), [busy, setBusy] = useState(false), [collect, setCollect] = useState<Order | null>(null), [cancel, setCancel] = useState<Order | null>(null), [cashDestination, setCashDestination] = useState("drawer"), [received, setReceived] = useState(""), [sound, setSound] = useState(false), [updated, setUpdated] = useState(0);
    const audio = useRef<AudioContext | null>(null), known = useRef<Set<string> | null>(null);
    const load = useCallback(async () => { try {
        const r = await api<{
            orders: Order[];
            summary: Summary;
        }>("/api/admin/orders");
        if (known.current && r.orders.some(o => !known.current!.has(o.id) && o.status === "received") && audio.current?.state === "running") {
            const osc = audio.current.createOscillator(), g = audio.current.createGain();
            osc.connect(g);
            g.connect(audio.current.destination);
            g.gain.value = .1;
            osc.frequency.value = 660;
            osc.start();
            osc.stop(audio.current.currentTime + .25);
        }
        known.current = new Set(r.orders.map(o => o.id));
        setOrders(r.orders);
        setSummary(r.summary);
        setUpdated(Date.now());
        setError("");
    }
    catch (e) {
        setError((e as Error).message);
    } }, []);
    useEffect(() => { void load(); const t = setInterval(() => void load(), 10000); return () => { clearInterval(t); }; }, [load]);
    useEffect(() => () => { void audio.current?.close(); }, []);
    async function toggleSound() { if (sound) {
        await audio.current?.suspend();
        setSound(false);
    }
    else {
        try {
            audio.current ??= new AudioContext();
            await audio.current.resume();
            setSound(true);
        }
        catch {
            setError("ამ ბრაუზერში ხმა ვერ ჩაირთო.");
        }
    } }
    async function act(o: Order, body: object) { if (busy)
        return; setBusy(true); setError(""); try {
        await api(`/api/orders/${o.id}`, { method: "PATCH", body: JSON.stringify(body) });
        setCollect(null);
        setCancel(null);
        await load();
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        setBusy(false);
    } }
    const visible = orders?.filter(o => filter === "all" ? true : filter === "active" ? !["completed", "cancelled"].includes(o.status) : o.status === filter) || [];
    return <AdminShell active="/admin"><div className="page-heading"><div><p className="eyebrow">{t("ხინკალიუსის სამზარეულო")}</p><h1>{t("შეკვეთები")}</h1><p>{t("ონლაინ და ადგილზე მიღებული შეკვეთები ერთ რიგში.")}</p></div><div className="heading-actions"><button className="secondary" onClick={() => void toggleSound()}>{sound ? <Bell size={18}/> : <BellOff size={18}/>}{" " + t("ხმა") + " "}{sound ? t("ჩართულია") : t("ჩართე")}</button><button className="secondary" onClick={() => void load()} aria-label={t("განახლება")}><RefreshCw size={18}/></button></div></div><div className="stats-row"><div><span>{t("აქტიური")}</span><strong>{summary?.active ?? "—"}</strong></div><div><span>{t("დღეს მიღებული შეკვეთები")}</span><strong>{summary?.today_count ?? "—"}</strong></div><div><span>{t("ნაღდი · მიღებულია დღეს")}</span><strong>{money(summary?.cash ?? 0)}</strong></div><div><span>{t("ტერმინალი · დღეს")}</span><strong>{money(summary?.terminal ?? 0)}</strong></div></div><Tabs value={filter} onValueChange={setFilter}><TabsList className="kitchen-tabs">{[["active", t("აქტიური")], ["received", t("ახალი")], ["cooking", t("მზადდება")], ["ready", t("მზადაა")], ["completed", t("დასრულებული")], ["all", t("ყველა")]].map(([v, l]) => <TabsTrigger key={v} value={v}>{t(l)}</TabsTrigger>)}</TabsList></Tabs><ErrorNote message={error} onRetry={() => void load()}/>{!orders ? <Loading /> : visible.length ? <div className="tickets">{visible.map(o => { const closed = ["completed", "cancelled"].includes(o.status), paid = ["cash_collected", "terminal_collected"].includes(o.payment_status); return <article className="ticket" key={o.id}><header><strong>#{o.id.slice(0, 8).toUpperCase()}</strong><time>{new Date(o.created_at).toLocaleTimeString(locale, { timeZone: "Asia/Tbilisi", hour: "2-digit", minute: "2-digit" })}</time></header><div className="ticket-badges"><span className={`status-pill status-${o.status}`}>{t(STATUS_LABELS[o.status])}</span><span className="source-tag">{o.source === "pos" ? t("სალარო") : o.fulfillment === "delivery" ? t("საიტი · მიტანა") : t("საიტი · გატანა")}</span></div><h2>{o.customer_name==="ადგილზე სტუმარი"?t(o.customer_name):o.customer_name}</h2><div className="ticket-items">{o.items.map(i => <div key={i.id}><strong>{i.quantity} × {itemName(i,locale)}</strong><span>{money(i.quantity * i.price)}</span></div>)}</div><div className="ticket-details">{o.phone && <p><a href={`tel:${o.phone}`}>{o.phone}</a></p>}<p>{o.fulfillment==="pickup"?t("გატანა"):o.address}</p>{o.delivery_lat != null && o.delivery_lng != null && <a className="text-button" href={`https://www.openstreetmap.org/?mlat=${o.delivery_lat}&mlon=${o.delivery_lng}#map=17/${o.delivery_lat}/${o.delivery_lng}`} target="_blank" rel="noreferrer">{"" + t("მიტანის პინი ·") + " "}{locale==="en"?o.zone_name_en:locale==="ru"?o.zone_name_ru:o.zone_name}</a>}{o.note && <p className="order-note">{o.note}</p>}<p className="small"><Clock size={14}/>{" " + t("დაპირებული დრო: ~") + ""}{o.prep_minutes}{" " + t("წთ") + ""}</p></div><div className="ticket-total"><strong>{money(o.total)}</strong><span className={paid ? "paid" : ""}>{t(PAYMENT_LABELS[o.payment_status])}</span></div>{!closed && <div className="ticket-actions">{!paid && o.payment_status !== "demo_unpaid" && <button className="secondary full" disabled={busy} onClick={() => { setCollect(o); setCashDestination(o.fulfillment === "delivery" ? "courier" : "drawer"); setReceived(String(o.total / 100)); setError(""); }}>{o.payment_method === "cash" ? <Banknote size={17}/> : <CreditCard size={17}/>}{" " + t("თანხის მიღება") + ""}</button>}<button className="primary full" disabled={busy || (nextStatus(o) === "completed" && !paid)} onClick={() => void act(o, { action: "status", status: nextStatus(o) })}>{o.status === "received" ? t("მომზადების დაწყება") : o.status === "cooking" ? t("მზად არის") : o.status === "ready" && o.fulfillment === "delivery" ? t("კურიერს გადაეცა") : t("ჩაბარებულია")}</button>{!paid && <button className="text-button cancel-button" disabled={busy} onClick={() => setCancel(o)}><X size={14}/>{" " + t("გაუქმება") + ""}</button>}</div>}</article>; })}</div> : <div className="empty-state"><ChefHat size={44}/><h2>{t("ამ სიაში შეკვეთები ჯერ არ არის")}</h2><p>{t("შექმენი საცდელი შეკვეთა საიტიდან ან სალაროდან.")}</p><a className="primary" href="/admin/pos">{t("სალაროს გახსნა")}</a></div>}<p className="small-note">{"" + t("მაქს. 300 ჩანაწერი, აქტიურები პირველ რიგში · სამუშაო დღე: 04:00–04:00, თბილისის დრო · თანხები მიღების თარიღით · ყველა თანხა საცდელია.") + " "}{updated ? t("განახლდა {0}", { "0": new Date(updated).toLocaleTimeString(locale, { timeZone: "Asia/Tbilisi" }) }) : ""}</p>
 <Dialog open={!!collect} onOpenChange={v => { if (!v && !busy)
        setCollect(null); }}><DialogContent><DialogHeader><DialogTitle>{t("თანხის მიღების დადასტურება")}</DialogTitle><DialogDescription>{t("საცდელი აღრიცხვა · #")}{collect?.id.slice(0, 8).toUpperCase()}</DialogDescription></DialogHeader>{collect && <><p className="payment-total">{"" + t("გადასახდელია") + " "}<strong>{money(collect.total)}</strong></p>{collect.payment_method === "cash" ? <><label className="field">{t("ნაღდი თანხის მდებარეობა")}<select value={cashDestination} onChange={e => setCashDestination(e.target.value)}><option value="drawer">{t("სალაროში · ღია ცვლა")}</option><option value="courier">{t("კურიერთან / სალაროს გარეთ")}</option></select></label><a className="text-button" href="/admin/shifts">{t("სალაროს ცვლები")}</a><label className="field">{t("მიღებული თანხა ₾")}<input type="number" min={collect.total / 100} step="0.01" value={received} onChange={e => setReceived(e.target.value)}/></label><p>{"" + t("ხურდა:") + " "}<strong>{money(Math.max(0, Math.round(Number(received) * 100) - collect.total))}</strong></p></> : <div className="notice">{t("დაადასტურე მხოლოდ ტერმინალზე წარმატებული გადახდის შემდეგ. ტერმინალი საიტთან ავტომატურად დაკავშირებული არ არის.")}</div>}<ErrorNote message={error}/><button className="primary full" disabled={busy || (collect.payment_method === "cash" && Math.round(Number(received) * 100) < collect.total)} onClick={() => void act(collect, { action: "collect", cashDestination, cashReceived: Math.round(Number(received) * 100) })}><Check size={18}/>{busy ? t("ინახება…") : t("თანხა მიღებულია")}</button></>}</DialogContent></Dialog>
 <AlertDialog open={!!cancel} onOpenChange={v => !v && setCancel(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t("გავაუქმოთ შეკვეთა?")}</AlertDialogTitle><AlertDialogDescription>{t("შეკვეთა #")}{cancel?.id.slice(0, 8).toUpperCase()}{" " + t("აქტიური რიგიდან გაუქმებულებში გადავა.") + ""}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{t("დატოვება")}</AlertDialogCancel><AlertDialogAction onClick={() => cancel && void act(cancel, { action: "status", status: "cancelled" })}>{t("შეკვეთის გაუქმება")}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></AdminShell>;
}
