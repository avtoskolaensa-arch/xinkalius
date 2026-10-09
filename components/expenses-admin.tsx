"use client";
import {requestId} from "@/lib/request-id";
import {useI18n} from "./language-provider";
import { useCallback, useEffect, useRef, useState } from 'react';
import { AdminShell, ErrorNote, Loading } from './site-shell';
import { api } from '@/lib/client';
import { money } from '@/lib/menu';
import { EXPENSE_CATEGORIES, localInput, fromLocal, type Expense } from '@/lib/finance';
import { STAT_PERIODS, statisticDate, statisticTime, type StatPeriod } from '@/lib/statistics';
export default function ExpensesAdmin() {
    const { t, locale } = useI18n();
    const [period, setPeriod] = useState<StatPeriod>('month'), [data, setData] = useState<{
        expenses: Expense[];
        total: number;
        count: number;
    } | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false), [amount, setAmount] = useState(''), [category, setCategory] = useState('rent'), [description, setDescription] = useState(''), [paidAt, setPaidAt] = useState(localInput()), [source, setSource] = useState('bank'), [voiding, setVoiding] = useState<Expense | null>(null), [reason, setReason] = useState('');
    const key = useRef(''), guard = useRef(false),generation=useRef(0);
    const load=useCallback(async()=>{const version=++generation.current;try{const next=await api<{expenses:Expense[];total:number;count:number}>(`/api/admin/expenses?period=${period}`);if(version===generation.current){setData(next);setError('');}}catch(e){if(version===generation.current)setError((e as Error).message);}},[period]);
    useEffect(()=>{setData(null);void load();return()=>{generation.current++;};},[load]);
    useEffect(()=>{try{const pending=JSON.parse(localStorage.getItem("xinkaliusi-expense-pending")||"null");if(pending?.requestKey){key.current=pending.requestKey;setAmount(String(pending.amount/100));setCategory(pending.category);setDescription(pending.description);setPaidAt(localInput(pending.paidAt));setSource(pending.paymentSource);}}catch{}},[]);
    function dirty() { key.current = ''; }
    async function save(e: React.FormEvent) { e.preventDefault(); if (guard.current)
        return; guard.current = true; setBusy(true); setError(''); key.current ||= requestId(); try {
        const payload={requestKey:key.current,amount:Math.round(Number(amount)*100),category,description,paidAt:fromLocal(paidAt),paymentSource:source};try{localStorage.setItem('xinkaliusi-expense-pending',JSON.stringify(payload));}catch{}
        await api('/api/admin/expenses', {method:'POST',body:JSON.stringify(payload)});try{localStorage.removeItem('xinkaliusi-expense-pending');}catch{}
        setAmount('');
        setDescription('');
        setPaidAt(localInput());
        key.current = '';
        await load();
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        guard.current = false;
        setBusy(false);
    } }
    async function voidExpense(e: React.FormEvent) { e.preventDefault(); if (!voiding || busy)
        return; setBusy(true); try {
        await api('/api/admin/expenses', { method: 'PATCH', body: JSON.stringify({ id: voiding.id, reason }) });
        setVoiding(null);
        setReason('');
        await load();
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        setBusy(false);
    } }
    return <AdminShell active="/admin/expenses"><div className="page-heading"><div><p className="eyebrow">{t("ბიზნესის ხარჯები")}</p><h1>{t("ხარჯების აღრიცხვა")}</h1><p>{t("ჩაწერე რეალურად გადახდილი ხარჯები. ისინი სტატისტიკაში იმავე პერიოდს გამოაკლდება.")}</p></div><a className="secondary" href="/admin/statistics">{t("სტატისტიკის ნახვა")}</a></div><div className="finance-layout"><section className="settings-card"><h2>{t("ახალი ხარჯი")}</h2><form onSubmit={save}><fieldset disabled={busy} onChange={dirty}><div className="form-grid"><label className="field">{t("თანხა ₾")}<input required type="number" step="0.01" min="0.01" max="1000000" value={amount} onChange={e => setAmount(e.target.value)}/></label><label className="field">{t("კატეგორია")}<select value={category} onChange={e => setCategory(e.target.value)}>{Object.entries(EXPENSE_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{t(v)}</option>)}</select></label></div><label className="field">{t("აღწერა")}<input required minLength={2} maxLength={300} value={description} onChange={e => setDescription(e.target.value)} placeholder={t("მაგ.: ოქტომბრის ქირა")}/></label><label className="field">{t("გადახდის დრო · თბილისი")}<input type="datetime-local" required value={paidAt} max={localInput()} onChange={e => setPaidAt(e.target.value)}/></label><label className="field">{t("საიდან გადაიხადე?")}<select value={source} onChange={e => { setSource(e.target.value); if (e.target.value === 'drawer')
        setPaidAt(localInput()); }}><option value="bank">{t("ბანკი / ბარათი")}</option><option value="external_cash">{t("ნაღდი · სალაროს გარეთ")}</option><option value="drawer">{t("მიმდინარე სალაროს ცვლიდან")}</option></select></label><p className="small-note">{t("ინგრედიენტები და თვითღირებულებაში უკვე შეტანილი შეფუთვა აქ ხელახლა არ ჩაწერო — ხარჯი ორჯერ გამოიქვითება.")}</p><button className="primary full" disabled={busy}>{busy ? t("ინახება…") : t("ხარჯის შენახვა")}</button></fieldset></form></section><section><div className="stat-periods" role="group" aria-label={t("ხარჯების პერიოდი")}>{STAT_PERIODS.map(p => <button key={p.id} aria-pressed={period === p.id} onClick={() => setPeriod(p.id)}>{t(p.label)}</button>)}</div><ErrorNote message={error} onRetry={() => void load()}/>{!data ? <Loading /> : <><div className="stat-metrics"><article className="stat-metric"><span>{t("აღრიცხული ხარჯები")}</span><strong>{money(data.total)}</strong><small>{data.count}{" " + t("ჩანაწერი · 04:00–04:00") + ""}</small></article></div><div className="expense-list">{data.expenses.length ? data.expenses.map(e => <article className={`settings-card ${e.voided_at ? 'voided' : ''}`} key={e.id}><div className="page-heading"><div><strong>{t(EXPENSE_CATEGORIES[e.category])}</strong><p>{e.description}</p><small>{statisticDate(e.paid_at, locale)} · {statisticTime(e.paid_at)}</small></div><strong>{money(e.amount)}</strong></div><p className="small-note">{{ bank: t("ბანკი / ბარათი"), external_cash: t("ნაღდი · სალაროს გარეთ"), drawer: t("სალაროს ცვლიდან") }[e.payment_source]}</p>{e.voided_at ? <p className="small-note">{"" + t("გაუქმებულია:") + " "}{e.void_reason}</p> : <button className="text-button" onClick={() => { setVoiding(e); setReason(''); }}>{t("შეცდომით ჩაწერილის გაუქმება")}</button>}</article>) : <p className="empty-state">{t("ამ პერიოდში ხარჯები არ არის.")}</p>}</div>{data.expenses.length === 500 && <p>{t("ნაჩვენებია ბოლო 500 ჩანაწერი; ჯამი მოიცავს სრულ პერიოდს.")}</p>}</>}{voiding && <form className="settings-card" onSubmit={voidExpense}><h2>{t("ხარჯის გაუქმება")}</h2><p>{voiding.description} · {money(voiding.amount)}</p><label className="field">{t("გაუქმების მიზეზი")}<input required minLength={3} maxLength={300} value={reason} onChange={e => setReason(e.target.value)}/></label><div className="heading-actions"><button className="secondary" type="button" onClick={() => setVoiding(null)}>{t("დატოვება")}</button><button className="primary" disabled={busy}>{t("გაუქმების დადასტურება")}</button></div><p className="small-note">{t("ჩანაწერი ისტორიაში დარჩება. დახურული სალაროს ხარჯი აღარ იცვლება.")}</p></form>}</section></div></AdminShell>;
}
