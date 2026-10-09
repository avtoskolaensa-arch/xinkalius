import {getDb} from "@/db";
import {currentOwner,apiError,fail} from "@/lib/server";
import {isStatPeriod,statisticRange,statisticBuckets,statisticSqlOffset,type StatSummary,type StatPoint,type StatProduct,type Statistics} from "@/lib/statistics";
import {SUMMARY_SQL,SERIES_SQL,PRODUCTS_SQL,UNDATED_SQL} from "@/lib/statistics-sql";
export const dynamic="force-dynamic";
export async function GET(request:Request){
  const owner=await currentOwner();if(!owner)return fail("შესვლა აუცილებელია.",401);
  const period=new URL(request.url).searchParams.get("period")??"today";
  if(!isStatPeriod(period))return fail("აირჩიე სწორი პერიოდი.");
  try {
    const now=new Date(),range=statisticRange(period,now),nextResetAt=statisticRange("today",now).end,db=getDb();
    const pattern=range.group==="hour"?"%Y-%m-%dT%H":range.group==="day"?"%Y-%m-%d":"%Y-%m";
    const [totals,series,products,undated]=await db.batch([
      db.prepare(SUMMARY_SQL).bind(owner,range.start,range.end),
      db.prepare(SERIES_SQL).bind(owner,range.start,range.end,pattern,statisticSqlOffset(range.group)),
      db.prepare(PRODUCTS_SQL).bind(owner,range.start,range.end),
      db.prepare(UNDATED_SQL).bind(owner),
    ]);
    const raw=totals.results[0] as unknown as StatSummary;
    const summary={...raw,averageOrder:raw.orders?Math.round(raw.revenue/raw.orders):0,margin:raw.grossProfit!==null&&raw.productSales>0?raw.grossProfit/raw.productSales*100:null};
    const seriesRows=series.results as Array<Partial<StatPoint> & {key:string}>;
    const points=statisticBuckets(range).map(point=>({...point,...seriesRows.find(row=>row.key===point.key)}));
    const undatedCount=undated.results[0] as {count:number}|undefined;
    const report:Statistics={range,summary,points,products:products.results as unknown as StatProduct[],undatedPayments:Number(undatedCount?.count??0),generatedAt:Date.now(),nextResetAt};
    return Response.json(report,{headers:{"Cache-Control":"no-store"}});
  } catch(error){return apiError(error);}
}
