"use client";
import {useEffect,useState} from "react";
import {BarChart3,RefreshCw,Banknote,CreditCard,ShoppingBag,Globe,Store,Info,ArrowUpRight} from "lucide-react";
import {AdminShell,ErrorNote,Loading} from "./site-shell";
import {api} from "@/lib/client";
import {money} from "@/lib/menu";
import {STAT_PERIODS,statisticDate,statisticTime,type StatPeriod,type Statistics,type StatPoint} from "@/lib/statistics";
const valueMoney=(value:number|null)=>value===null?"უცნობია":money(value);

function RevenueChart({points}:{points:StatPoint[]}){
  const max=Math.max(1,...points.map(p=>p.revenue)),step=940/points.length,bar=Math.min(48,step*.65),stride=Math.ceil(points.length/8);
  return <svg className="revenue-chart" viewBox="0 0 1020 270" role="img" aria-label="მიღებული თანხის განაწილება. ზუსტი თანხები ხელმისაწვდომია ქვემოთ, დეტალურ ცხრილში.">
    {[0,.5,1].map(r=><g key={r}><line x1="70" x2="1010" y1={215-175*r} y2={215-175*r} stroke="#e4eeea" strokeDasharray="4 5"/><text x="61" y={220-175*r} textAnchor="end">{(max*r/100).toFixed(max*r%100===0?0:1)} ₾</text></g>)}
    {points.map((p,i)=>{const height=p.revenue/max*175,x=70+i*step+(step-bar)/2;return <g key={p.key}><rect x={x} y={215-height} width={bar} height={height} rx="4" fill="#168575"><title>{`${p.fullLabel}: ${money(p.revenue)} · ${p.orders} შეკვეთა`}</title></rect>{(i%stride===0||i===points.length-1)&&<text x={70+i*step+step/2} y="244" textAnchor="middle">{p.label}</text>}</g>;})}
  </svg>;
}
export function StatisticsPanel({period,data,error,loading,onPeriod,onRefresh}:{period:StatPeriod;data:Statistics|null;error:string;loading:boolean;onPeriod:(period:StatPeriod)=>void;onRefresh:()=>void}){
  const summary=data?.summary;
  return <>
    <div className="page-heading"><div><p className="eyebrow">ხინკალიუსი · ბიზნესის სურათი</p><h1>სტატისტიკა</h1><p>ნავაჭრი, თვითღირებულება და პროდუქციის მოგება.</p></div><button className="secondary" disabled={loading} onClick={onRefresh}><RefreshCw size={17}/>{loading?"იტვირთება…":"განახლება"}</button></div>
    <div className="stat-periods" role="group" aria-label="სტატისტიკის პერიოდი">{STAT_PERIODS.map(p=><button key={p.id} type="button" aria-pressed={period===p.id} onClick={()=>onPeriod(p.id)}>{p.label}</button>)}</div>
    <ErrorNote message={error} onRetry={onRefresh}/>
    {!data&&!error&&<Loading/>}
    {data&&summary&&<div className="statistics-report" aria-busy={loading}>
      <div className="stat-date"><span>{statisticDate(data.range.start)}{data.range.group!=="hour"&&` — ${statisticDate(data.range.end-1)}`}</span><small>თანხის მიღების თარიღით · თბილისის დრო</small></div>
      {data.undatedPayments>0&&<div className="notice" role="status">{data.undatedPayments} გადახდილ შეკვეთას თანხის მიღების თარიღი არ აქვს შენახული და პერიოდების ჯამებში არ შედის.</div>}
      {summary.missingCostOrders>0&&<div className="notice" role="status">{summary.missingCostOrders} შეკვეთაში თვითღირებულება სრულად არ არის შენახული. ნავაჭრი დათვლილია, სრული თვითღირებულება და მოგება კი უცნობია.</div>}
      <div className="stat-metrics">
        <article className="stat-metric stat-metric-main"><span>ნავაჭრი · მიღებული თანხა</span><strong>{money(summary.revenue)}</strong><small>პროდუქცია + მიტანის საფასური</small></article>
        <article className="stat-metric"><span>პროდუქციის თვითღირებულება</span><strong>{valueMoney(summary.cost)}</strong><small>შეკვეთაში შენახული თვითღირებულებით</small></article>
        <article className={`stat-metric stat-metric-profit ${(summary.grossProfit??0)<0?"stat-negative":""}`}><span>პროდუქციის მთლიანი მოგება</span><strong>{valueMoney(summary.grossProfit)}</strong><small>{summary.margin===null?"მარჟა: —":`მარჟა: ${summary.margin.toFixed(1)}%`} · სხვა ხარჯებამდე</small></article>
        <article className="stat-metric"><span>გადახდილი შეკვეთები</span><strong>{summary.orders}</strong><small>გატანა {summary.pickupOrders} · მიტანა {summary.deliveryOrders}</small></article>
        <article className="stat-metric"><span>საშუალო ჩეკი</span><strong>{money(summary.averageOrder)}</strong><small>მიღებული თანხა ÷ შეკვეთები</small></article>
        <article className="stat-metric"><span>გაყიდული ერთეულები</span><strong>{summary.units}</strong><small>ყველა პროდუქტი ერთად</small></article>
      </div>
      <div className="stat-explanation"><Info size={18}/><p><strong>ეს ჯერ წმინდა მოგება არ არის.</strong> პროდუქციის მოგება = პროდუქციის გაყიდვები − თვითღირებულება. ქირა, ხელფასები, კურიერის ხარჯი, საკომისიოები, გადასახადები და სხვა ხარჯები აქ არ გამოიქვითება. მიტანის საფასური მოგებაში არ შეგვაქვს.</p></div>
      <section className="stat-panel"><div className="stat-panel-heading"><div><h2>ნავაჭრის დინამიკა</h2><p>{data.range.group==="hour"?"საათების მიხედვით":data.range.group==="day"?"დღეების მიხედვით":"თვეების მიხედვით"}</p></div><span className="stat-legend"><i/> მიღებული თანხა</span></div>
        {summary.orders>0?<><div className="stat-chart-scroll"><RevenueChart points={data.points}/></div><details className="stat-details"><summary>ზუსტი თანხების ნახვა ცხრილში</summary><div className="stat-table-scroll"><table><caption className="sr-only">ნავაჭრი და მოგება პერიოდების მიხედვით</caption><thead><tr><th>პერიოდი</th><th>შეკვეთები</th><th>ნავაჭრი</th><th>თვითღირებულება</th><th>პროდუქციის მოგება</th></tr></thead><tbody>{data.points.map(p=><tr key={p.key}><th scope="row">{p.fullLabel}</th><td>{p.orders}</td><td>{money(p.revenue)}</td><td>{valueMoney(p.cost)}</td><td>{valueMoney(p.grossProfit)}</td></tr>)}</tbody></table></div></details></>:<div className="stat-empty"><BarChart3 size={38}/><h3>ამ პერიოდში გადახდები ჯერ არ არის</h3><p>თანხის მიღების დადასტურების შემდეგ ნავაჭრი აქ გამოჩნდება.</p><a className="text-button" href="/admin/pos">სალაროს გახსნა <ArrowUpRight size={15}/></a></div>}
      </section>
      <div className="stat-breakdowns">
        <section className="stat-panel"><h2>შემოსავლის შემადგენლობა</h2><dl><div><dt><ShoppingBag size={17}/>პროდუქციის გაყიდვები</dt><dd>{money(summary.productSales)}</dd></div><div><dt>მიტანის საფასური</dt><dd>{money(summary.deliveryFees)}</dd></div><div className="stat-dl-total"><dt>სულ მიღებულია</dt><dd>{money(summary.revenue)}</dd></div></dl></section>
        <section className="stat-panel"><h2>გადახდის მეთოდი</h2><dl><div><dt><Banknote size={17}/>ნაღდი</dt><dd>{money(summary.cash)}</dd></div><div><dt><CreditCard size={17}/>ტერმინალი</dt><dd>{money(summary.terminal)}</dd></div></dl><p className="stat-footnote">აღრიცხული თანხა, ხურდის გარეშე.</p></section>
        <section className="stat-panel"><h2>შეკვეთის წყარო</h2><dl><div><dt><Globe size={17}/>საიტი</dt><dd>{money(summary.web)}</dd></div><div><dt><Store size={17}/>ადგილზე · სალარო</dt><dd>{money(summary.pos)}</dd></div></dl><p className="stat-footnote">მხოლოდ გადახდილი შეკვეთების ნავაჭრი.</p></section>
      </div>
      <section className="stat-panel"><div className="stat-panel-heading"><div><h2>წამყვანი პროდუქტები</h2><p>პირველი 10 პროდუქტი გაყიდვების თანხის მიხედვით</p></div></div>{data.products.length>0?<div className="stat-table-scroll"><table className="stat-products"><caption className="sr-only">ყველაზე გაყიდვადი პროდუქტები</caption><thead><tr><th>პროდუქტი</th><th>გაიყიდა</th><th>გაყიდვები</th><th>თვითღირებულება</th><th>მოგება</th></tr></thead><tbody>{data.products.map((p,i)=><tr key={p.id}><th scope="row"><span className="stat-rank">{i+1}</span>{p.name}</th><td>{p.quantity} ც.</td><td>{money(p.revenue)}</td><td>{valueMoney(p.cost)}</td><td className={(p.grossProfit??0)<0?"stat-loss":""}>{valueMoney(p.grossProfit)}</td></tr>)}</tbody></table></div>:<p className="muted">გაყიდვის შემდეგ პროდუქტები აქ გამოჩნდება.</p>}</section>
      <p className="stat-footnote">კვირა იწყება ორშაბათს. გადაუხდელი და გაუქმებული შეკვეთები ნავაჭრში არ ითვლება. ყველა თანხა საცდელი აღრიცხვიდანაა. განახლდა {statisticTime(data.generatedAt)}.</p>
    </div>}
  </>;
}
export default function StatisticsAdmin(){
  const [period,setPeriod]=useState<StatPeriod>("today"),[data,setData]=useState<Statistics|null>(null),[error,setError]=useState(""),[loading,setLoading]=useState(true),[revision,setRevision]=useState(0);
  useEffect(()=>{const controller=new AbortController();setLoading(true);setError("");void api<Statistics>(`/api/admin/statistics?period=${period}`,{signal:controller.signal}).then(result=>{if(!controller.signal.aborted)setData(result);}).catch(error=>{if(!controller.signal.aborted)setError((error as Error).message);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return()=>controller.abort();},[period,revision]);
  return <AdminShell active="/admin/statistics"><StatisticsPanel period={period} data={data} error={error} loading={loading} onPeriod={next=>{if(next!==period){setData(null);setError("");setPeriod(next);}}} onRefresh={()=>setRevision(value=>value+1)}/></AdminShell>;
}
