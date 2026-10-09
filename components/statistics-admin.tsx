"use client";
import {useI18n} from "./language-provider";
import { useEffect, useState } from "react";
import { BarChart3, RefreshCw, Banknote, CreditCard, ShoppingBag, Globe, Store, Info, ArrowUpRight } from "lucide-react";
import { AdminShell, ErrorNote, Loading } from "./site-shell";
import { api } from "@/lib/client";
import { money } from "@/lib/menu";
import { localizedStatPoint, STAT_PERIODS, statisticDate, statisticTime, type StatPeriod, type Statistics, type StatPoint } from "@/lib/statistics";
function RevenueChart({ points }: {
    points: StatPoint[];
}) {
    const { t, locale } = useI18n();
    const max = Math.max(1, ...points.map(p => p.revenue)), step = 940 / points.length, bar = Math.min(48, step * .65), stride = Math.ceil(points.length / 8);
    return <svg className="revenue-chart" viewBox="0 0 1020 270" role="img" aria-label={t("მიღებული თანხის განაწილება. ზუსტი თანხები ხელმისაწვდომია ქვემოთ, დეტალურ ცხრილში.")}>
    {[0, .5, 1].map(r => <g key={r}><line x1="70" x2="1010" y1={215 - 175 * r} y2={215 - 175 * r} stroke="#e4eeea" strokeDasharray="4 5"/><text x="61" y={220 - 175 * r} textAnchor="end">{(max * r / 100).toFixed(max * r % 100 === 0 ? 0 : 1)} ₾</text></g>)}
    {points.map((p, i) => { const height = p.revenue / max * 175, x = 70 + i * step + (step - bar) / 2; return <g key={p.key}><rect x={x} y={215 - height} width={bar} height={height} rx="4" fill="#168575"><title>{t("{0}: {1} · {2} შეკვეთა", { "0": p.fullLabel, "1": money(p.revenue), "2": p.orders })}</title></rect>{(i % stride === 0 || i === points.length - 1) && <text x={70 + i * step + step / 2} y="244" textAnchor="middle">{t(p.label)}</text>}</g>; })}
  </svg>;
}
export function StatisticsPanel({ period, data, error, loading, onPeriod, onRefresh }: {
    period: StatPeriod;
    data: Statistics | null;
    error: string;
    loading: boolean;
    onPeriod: (period: StatPeriod) => void;
    onRefresh: () => void;
}) {
    const { t, locale } = useI18n();
    const valueMoney = (value: number | null) => value === null ? t("უცნობია") : money(value);
    const summary = data?.summary;const points=data?.points.map(p=>localizedStatPoint(p,data.range.group,locale))??[];
    return <>
    <div className="page-heading"><div><p className="eyebrow">{t("ხინკალიუსი · ბიზნესის სურათი")}</p><h1>{t("სტატისტიკა")}</h1><p>{t("ნავაჭრი, თვითღირებულება და პროდუქციის მოგება.")}</p></div><button className="secondary" disabled={loading} onClick={onRefresh}><RefreshCw size={17}/>{loading ? t("იტვირთება…") : t("განახლება")}</button></div>
    <div className="stat-periods" role="group" aria-label={t("სტატისტიკის პერიოდი")}>{STAT_PERIODS.map(p => <button key={p.id} type="button" aria-pressed={period === p.id} onClick={() => onPeriod(p.id)}>{t(p.label)}</button>)}</div>
    <ErrorNote message={error} onRetry={onRefresh}/>
    {!data && !error && <Loading />}
    {data && summary && <div className="statistics-report" aria-busy={loading}>
      <div className="stat-date"><span>{statisticDate(data.range.start, locale)} · {statisticTime(data.range.start)} — {statisticDate(data.range.end, locale)} · {statisticTime(data.range.end)}</span><small>{t("სამუშაო დღე 04:00–04:00 · თბილისის დრო")}</small></div>
      {data.undatedPayments > 0 && <div className="notice" role="status">{data.undatedPayments}{" " + t("გადახდილ შეკვეთას თანხის მიღების თარიღი არ აქვს შენახული და პერიოდების ჯამებში არ შედის.") + ""}</div>}
      {summary.missingCostOrders > 0 && <div className="notice" role="status">{summary.missingCostOrders}{" " + t("შეკვეთაში თვითღირებულება სრულად არ არის შენახული. ნავაჭრი დათვლილია, სრული თვითღირებულება და მოგება კი უცნობია.") + ""}</div>}
      <div className="stat-metrics">
        <article className="stat-metric stat-metric-main"><span>{t("ნავაჭრი · მიღებული თანხა")}</span><strong>{money(summary.revenue)}</strong><small>{t("პროდუქცია + მიტანის საფასური")}</small></article>
        <article className="stat-metric"><span>{t("პროდუქციის თვითღირებულება")}</span><strong>{valueMoney(summary.cost)}</strong><small>{t("შეკვეთაში შენახული თვითღირებულებით")}</small></article>
        <article className={`stat-metric stat-metric-profit ${(summary.grossProfit ?? 0) < 0 ? "stat-negative" : ""}`}><span>{t("პროდუქციის მთლიანი მოგება")}</span><strong>{valueMoney(summary.grossProfit)}</strong><small>{summary.margin === null ? t("მარჟა: —") : t("მარჟა: {0}%", { "0": summary.margin.toFixed(1) })}{" " + t("· სხვა ხარჯებამდე") + ""}</small></article>
        <article className="stat-metric"><span>{t("გადახდილი შეკვეთები")}</span><strong>{summary.orders}</strong><small>{"" + t("გატანა") + " "}{summary.pickupOrders}{" " + t("· მიტანა") + " "}{summary.deliveryOrders}</small></article>
        <article className="stat-metric"><span>{t("საშუალო ჩეკი")}</span><strong>{money(summary.averageOrder)}</strong><small>{t("მიღებული თანხა ÷ შეკვეთები")}</small></article>
        <article className="stat-metric"><span>{t("გაყიდული ერთეულები")}</span><strong>{summary.units}</strong><small>{t("ყველა პროდუქტი ერთად")}</small></article>
      </div>
      <div className="stat-metrics"><article className="stat-metric"><span>{t("აღრიცხული ხარჯები")}</span><strong>{money(summary.expenses)}</strong><small><a href="/admin/expenses">{t("ხარჯების მართვა")}</a></small></article><article className={`stat-metric stat-metric-profit ${(summary.operatingResult ?? 0) < 0 ? "stat-negative" : ""}`}><span>{t("შედეგი აღრიცხული ხარჯების შემდეგ")}</span><strong>{valueMoney(summary.operatingResult)}</strong><small>{t("ნავაჭრი − თვითღირებულება − ხარჯები")}</small></article></div>
      <div className="stat-explanation"><Info size={18}/><p>{t("შედეგი მოიცავს მიტანის შემოსავალსაც და გამოკლებს მხოლოდ შენ მიერ აღრიცხულ ხარჯებს. დაუფიქსირებელი ხარჯები მოგებას შეამცირებს. ინგრედიენტები და თვითღირებულებაში შეტანილი შეფუთვა მეორედ არ გამოიქვითება.")}</p></div>
      <section className="stat-panel"><div className="stat-panel-heading"><div><h2>{t("ნავაჭრის დინამიკა")}</h2><p>{data.range.group === "hour" ? t("საათების მიხედვით") : data.range.group === "day" ? t("დღეების მიხედვით") : t("თვეების მიხედვით")}</p></div><span className="stat-legend"><i />{" " + t("მიღებული თანხა") + ""}</span></div>
        {summary.orders > 0 ? <><div className="stat-chart-scroll"><RevenueChart points={points}/></div><details className="stat-details"><summary>{t("ზუსტი თანხების ნახვა ცხრილში")}</summary><div className="stat-table-scroll"><table><caption className="sr-only">{t("ნავაჭრი და მოგება პერიოდების მიხედვით")}</caption><thead><tr><th>{t("პერიოდი")}</th><th>{t("შეკვეთები")}</th><th>{t("ნავაჭრი")}</th><th>{t("თვითღირებულება")}</th><th>{t("პროდუქციის მოგება")}</th></tr></thead><tbody>{points.map(p => <tr key={p.key}><th scope="row">{p.fullLabel}</th><td>{p.orders}</td><td>{money(p.revenue)}</td><td>{valueMoney(p.cost)}</td><td>{valueMoney(p.grossProfit)}</td></tr>)}</tbody></table></div></details></> : <div className="stat-empty"><BarChart3 size={38}/><h3>{t("ამ პერიოდში გადახდები ჯერ არ არის")}</h3><p>{t("თანხის მიღების დადასტურების შემდეგ ნავაჭრი აქ გამოჩნდება.")}</p><a className="text-button" href="/admin/pos">{"" + t("სალაროს გახსნა") + " "}<ArrowUpRight size={15}/></a></div>}
      </section>
      <div className="stat-breakdowns">
        <section className="stat-panel"><h2>{t("შემოსავლის შემადგენლობა")}</h2><dl><div><dt><ShoppingBag size={17}/>{t("პროდუქციის გაყიდვები")}</dt><dd>{money(summary.productSales)}</dd></div><div><dt>{t("მიტანის საფასური")}</dt><dd>{money(summary.deliveryFees)}</dd></div><div className="stat-dl-total"><dt>{t("სულ მიღებულია")}</dt><dd>{money(summary.revenue)}</dd></div></dl></section>
        <section className="stat-panel"><h2>{t("გადახდის მეთოდი")}</h2><dl><div><dt><Banknote size={17}/>{t("ნაღდი")}</dt><dd>{money(summary.cash)}</dd></div><div><dt><CreditCard size={17}/>{t("ტერმინალი")}</dt><dd>{money(summary.terminal)}</dd></div></dl><p className="stat-footnote">{t("აღრიცხული თანხა, ხურდის გარეშე.")}</p></section>
        <section className="stat-panel"><h2>{t("შეკვეთის წყარო")}</h2><dl><div><dt><Globe size={17}/>{t("საიტი")}</dt><dd>{money(summary.web)}</dd></div><div><dt><Store size={17}/>{t("ადგილზე · სალარო")}</dt><dd>{money(summary.pos)}</dd></div></dl><p className="stat-footnote">{t("მხოლოდ გადახდილი შეკვეთების ნავაჭრი.")}</p></section>
      </div>
      <section className="stat-panel"><div className="stat-panel-heading"><div><h2>{t("წამყვანი პროდუქტები")}</h2><p>{t("პირველი 10 პროდუქტი გაყიდვების თანხის მიხედვით")}</p></div></div>{data.products.length > 0 ? <div className="stat-table-scroll"><table className="stat-products"><caption className="sr-only">{t("ყველაზე გაყიდვადი პროდუქტები")}</caption><thead><tr><th>{t("პროდუქტი")}</th><th>{t("გაიყიდა")}</th><th>{t("გაყიდვები")}</th><th>{t("თვითღირებულება")}</th><th>{t("მოგება")}</th></tr></thead><tbody>{data.products.map((p, i) => <tr key={p.id}><th scope="row"><span className="stat-rank">{i + 1}</span>{locale==="en"?(p.nameEn||t(p.name)):locale==="ru"?(p.nameRu||t(p.name)):p.name}</th><td>{p.quantity}{" " + t("ც.") + ""}</td><td>{money(p.revenue)}</td><td>{valueMoney(p.cost)}</td><td className={(p.grossProfit ?? 0) < 0 ? "stat-loss" : ""}>{valueMoney(p.grossProfit)}</td></tr>)}</tbody></table></div> : <p className="muted">{t("გაყიდვის შემდეგ პროდუქტები აქ გამოჩნდება.")}</p>}</section>
      <p className="stat-footnote">{"" + t("სამუშაო დღე იწყება 04:00-ზე, კვირა — ორშაბათს 04:00-ზე. თანხები ითვლება მიღების თარიღით. გადაუხდელი და გაუქმებული შეკვეთები ნავაჭრში არ ითვლება. ყველა თანხა საცდელი აღრიცხვიდანაა. განახლდა") + " "}{statisticTime(data.generatedAt)}.</p>
    </div>}
  </>;
}
export default function StatisticsAdmin() {
    const { t, locale } = useI18n();
    const [period, setPeriod] = useState<StatPeriod>("today"), [data, setData] = useState<Statistics | null>(null), [error, setError] = useState(""), [loading, setLoading] = useState(true), [revision, setRevision] = useState(0);
    useEffect(() => { const controller = new AbortController(); setLoading(true); setError(""); void api<Statistics>(`/api/admin/statistics?period=${period}`, { signal: controller.signal }).then(result => { if (!controller.signal.aborted)
        setData(result); }).catch(error => { if (!controller.signal.aborted)
        setError((error as Error).message); }).finally(() => { if (!controller.signal.aborted)
        setLoading(false); }); return () => controller.abort(); }, [period, revision]);
    useEffect(() => {
        if (!data)
            return;
        // Use the server's time interval so a different client clock cannot change the cutoff.
        const timer = window.setTimeout(() => { setData(null); setRevision(value => value + 1); }, Math.max(250, data.nextResetAt - data.generatedAt + 250));
        return () => clearTimeout(timer);
    }, [data]);
    useEffect(() => {
        const refresh = () => { if (document.visibilityState === "visible") {
            setData(null);
            setRevision(value => value + 1);
        } };
        window.addEventListener("focus", refresh);
        document.addEventListener("visibilitychange", refresh);
        return () => { window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
    }, []);
    return <AdminShell active="/admin/statistics"><StatisticsPanel period={period} data={data} error={error} loading={loading} onPeriod={next => { if (next !== period) {
        setData(null);
        setError("");
        setPeriod(next);
    } }} onRefresh={() => setRevision(value => value + 1)}/></AdminShell>;
}
