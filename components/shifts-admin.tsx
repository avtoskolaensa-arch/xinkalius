"use client";
import {requestId} from "@/lib/request-id";
import {useI18n} from "./language-provider";
import { useCallback, useEffect, useRef, useState } from 'react';
import { AdminShell, ErrorNote, Loading } from './site-shell';
import { api } from '@/lib/client';
import { money } from '@/lib/menu';
import type { Shift } from '@/lib/finance';
import { statisticDate, statisticTime } from '@/lib/statistics';
type Movement = {
    id: string;
    amount: number;
    kind: string;
    note: string;
    created_at: number;
};
export default function ShiftsAdmin() {
    const { t, locale } = useI18n();
    const [data, setData] = useState<{
        shifts: Shift[];
        movements: Movement[];
    } | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false), [opening, setOpening] = useState('0'), [counted, setCounted] = useState(''), [note, setNote] = useState(''), [moving, setMoving] = useState(''), [moveNote, setMoveNote] = useState(''), [kind, setKind] = useState('in'), [confirm, setConfirm] = useState(false);
    const request = useRef({ signature: '', key: '' }), guard = useRef(false);
    const load = useCallback(async () => { try {
        setData(await api('/api/admin/shifts'));
        setError('');
    }
    catch (e) {
        setError((e as Error).message);
    } }, []);
    useEffect(() => { void load(); const t = setInterval(() => void load(), 15000); return () => clearInterval(t); }, [load]);
    const active = data?.shifts.find(s => !s.closed_at);
    useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem("xinkaliusi-shift-request")||"null");if(saved?.signature&&saved?.key)request.current=saved;}catch{}},[]);
    async function act(body: object) { if (guard.current)
        return; guard.current = true; setBusy(true); setError(''); const signature = JSON.stringify(body); if (signature !== request.current.signature)
        request.current = { signature, key: requestId() }; try {
        try{localStorage.setItem('xinkaliusi-shift-request',JSON.stringify(request.current));}catch{}
        await api('/api/admin/shifts', { method: 'POST', body: JSON.stringify({ ...body, requestKey: request.current.key }) });
        request.current = { signature: '', key: '' };try{localStorage.removeItem('xinkaliusi-shift-request');}catch{}
        setCounted('');
        setMoving('');
        setMoveNote('');
        setNote('');
        setConfirm(false);
        await load();
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        guard.current = false;
        setBusy(false);
    } }
    return <AdminShell active="/admin/shifts"><div className="page-heading"><div><p className="eyebrow">{t("ფული სალაროში")}</p><h1>{t("სალაროს ცვლები")}</h1><p>{t("ცვლა ხელით იხსნება და იხურება. 04:00-ზე ღია ცვლა გრძელდება.")}</p></div><a className="secondary" href="/admin/pos">{t("სწრაფი სალარო")}</a></div><ErrorNote message={error} onRetry={() => void load()}/>{!data ? <Loading /> : <>{!active ? <form className="settings-card compact-form" onSubmit={e => { e.preventDefault(); void act({ action: 'open', openingCash: Math.round(Number(opening) * 100), note }); }}><h2>{t("ცვლის გახსნა")}</h2><label className="field">{t("საწყისი ნაღდი თანხა ₾")}<input type="number" required min="0" max="1000000" step="0.01" value={opening} onChange={e => setOpening(e.target.value)}/></label><label className="field">{t("შენიშვნა")}<input maxLength={300} value={note} onChange={e => setNote(e.target.value)}/></label><button className="primary" disabled={busy}>{t("ცვლის გახსნა")}</button></form> : <><div className="stat-metrics"><article className="stat-metric"><span>{t("მოსალოდნელი ნაღდი")}</span><strong>{money(active.expected)}</strong><small>{"" + t("გახსნილია") + " "}{statisticDate(active.opened_at, locale)} · {statisticTime(active.opened_at)}</small></article><article className="stat-metric"><span>{t("ნაღდი გაყიდვები")}</span><strong>{money(active.sales)}</strong><small>{t("სალაროში მიღებული, ხურდის გარეშე")}</small></article><article className="stat-metric"><span>{t("სალაროდან ხარჯები")}</span><strong>{money(active.expenses)}</strong><small><a href="/admin/expenses">{t("ხარჯის დამატება")}</a></small></article></div><p className="notice">{"" + t("საწყისი") + " "}{money(active.opening_cash)}{" " + t("+ გაყიდვები") + " "}{money(active.sales)}{" " + t("+ დამატება") + " "}{money(active.added)}{" " + t("− ხარჯები") + " "}{money(active.expenses)}{" " + t("− გატანა") + " "}{money(active.removed)}</p><p className="small-note">{t("ტერმინალი და კურიერთან დარჩენილი ნაღდი სალაროს ნაშთში არ შედის. კურიერისგან თანხის მიღება ჩაწერე დამატებად, შეკვეთის ნომრით.")}</p><div className="settings-columns"><form className="settings-card" onSubmit={e => { e.preventDefault(); void act({ action: 'move', id: active.id, amount: Math.round(Number(moving) * 100), kind, note: moveNote }); }}><h2>{t("ფულის დამატება / გატანა")}</h2><label className="field">{t("მოქმედება")}<select value={kind} onChange={e => setKind(e.target.value)}><option value="in">{t("სალაროში დამატება")}</option><option value="out">{t("სალაროდან გატანა")}</option></select></label><label className="field">{t("თანხა ₾")}<input required type="number" min="0.01" max="1000000" step="0.01" value={moving} onChange={e => setMoving(e.target.value)}/></label><label className="field">{t("მიზეზი")}<input required minLength={3} maxLength={300} value={moveNote} onChange={e => setMoveNote(e.target.value)}/></label><p className="small-note">{t("ეს ნაღდის მოძრაობაა. ხარჯი ცალკე „ხარჯებში“ ჩაწერე; ორივეგან ნუ გაიმეორებ.")}</p><button className="secondary" disabled={busy}>{t("მოძრაობის შენახვა")}</button></form><form className="settings-card" onSubmit={e => { e.preventDefault(); if (confirm)
            void act({ action: 'close', id: active.id, countedCash: Math.round(Number(counted) * 100), note });
        else
            setConfirm(true); }}><h2>{t("ცვლის დახურვა")}</h2><label className="field">{t("დათვლილი ნაღდი თანხა ₾")}<input required type="number" min="0" max="1000000" step="0.01" value={counted} onChange={e => { setCounted(e.target.value); setConfirm(false); }}/></label>{counted !== '' && <p className="notice">{"" + t("სხვაობა:") + " "}{money(Math.round(Number(counted) * 100) - active.expected)}</p>}<label className="field">{t("შენიშვნა")}<input maxLength={300} value={note} onChange={e => { setNote(e.target.value); setConfirm(false); }}/></label>{confirm && <p className="notice">{t("დაადასტურე დათვლილი თანხა. დახურული ცვლის ანგარიში აღარ შეიცვლება.")}</p>}<button className="primary" disabled={busy}>{confirm ? t("დახურვის დადასტურება") : t("ცვლის დახურვა")}</button></form></div>{data.movements.length > 0 && <section className="settings-card"><h2>{t("ამ ცვლის მოძრაობები")}</h2>{data.movements.map(m => <p key={m.id}>{statisticTime(m.created_at)} · {m.note} · {m.kind === 'in' ? '+' : '−'}{money(m.amount)}</p>)}</section>}</>}
 <section className="settings-card shift-history"><h2>{t("ცვლების ისტორია")}</h2><div className="stat-table-scroll"><table><thead><tr><th>{t("გახსნა")}</th><th>{t("დახურვა")}</th><th>{t("მოსალოდნელი")}</th><th>{t("დათვლილი")}</th><th>{t("სხვაობა")}</th><th>{t("შენიშვნა")}</th></tr></thead><tbody>{data.shifts.filter(s => s.closed_at).map(s => <tr key={s.id}><td>{statisticDate(s.opened_at, locale)} {statisticTime(s.opened_at)}</td><td>{statisticDate(s.closed_at!, locale)} {statisticTime(s.closed_at!)}</td><td>{money(s.expected_cash ?? 0)}</td><td>{money(s.counted_cash ?? 0)}</td><td className={(s.difference ?? 0) < 0 ? 'stat-loss' : ''}>{money(s.difference ?? 0)}</td><td>{s.note}</td></tr>)}</tbody></table></div>{!data.shifts.some(s => s.closed_at) && <p>{t("დახურული ცვლები ჯერ არ არის.")}</p>}<p className="small-note">{t("ბოლო 100 ცვლა. ფისკალურ ჩეკს არ ცვლის.")}</p></section></>}</AdminShell>;
}
