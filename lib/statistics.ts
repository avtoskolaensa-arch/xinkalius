export const STAT_PERIODS = [
  {id:"today", label:"დღეს"}, {id:"yesterday", label:"გუშინ"},
  {id:"week", label:"ამ კვირის"}, {id:"month", label:"ამ თვის"},
  {id:"year", label:"ამ წლის"}, {id:"lastYear", label:"წინა წლის"},
] as const;
export type StatPeriod = typeof STAT_PERIODS[number]["id"];
export type StatRange = {period:StatPeriod;start:number;end:number;group:"hour"|"day"|"month"};
export const TBILISI_OFFSET = 4 * 60 * 60 * 1000;
export const BUSINESS_DAY_START_HOUR = 4;
const BUSINESS_DAY_OFFSET = BUSINESS_DAY_START_HOUR * 60 * 60 * 1000;
// Hour labels use the wall clock; daily/monthly keys use the business date.
export function statisticSqlOffset(group:StatRange["group"]){return `${(TBILISI_OFFSET-(group==="hour"?0:BUSINESS_DAY_OFFSET))/3600000} hours`;}
const DAY = 24 * 60 * 60 * 1000;
const MONTHS=["იანვარი","თებერვალი","მარტი","აპრილი","მაისი","ივნისი","ივლისი","აგვისტო","სექტემბერი","ოქტომბერი","ნოემბერი","დეკემბერი"];
const SHORT_MONTHS=["იან","თებ","მარ","აპრ","მაი","ივნ","ივლ","აგვ","სექ","ოქტ","ნოე","დეკ"];
export function statisticDate(value:number){const d=new Date(value+TBILISI_OFFSET);return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}, ${d.getUTCFullYear()}`;}
export function statisticTime(value:number){return new Date(value+TBILISI_OFFSET).toISOString().slice(11,16);}
export function isStatPeriod(value:unknown): value is StatPeriod {return STAT_PERIODS.some(p=>p.id===value);}
export function statisticRange(period:StatPeriod, now=new Date()):StatRange {
  const parts=new Intl.DateTimeFormat("en",{timeZone:"Asia/Tbilisi",year:"numeric",month:"numeric",day:"numeric"}).formatToParts(new Date(now.getTime()-BUSINESS_DAY_OFFSET));
  const value=(type:string)=>Number(parts.find(p=>p.type===type)!.value);
  const y=value("year"),m=value("month")-1,d=value("day");
  const localDay=Date.UTC(y,m,d);
  let start=localDay,end=start+DAY,group:StatRange["group"]="hour";
  if(period==="yesterday"){start-=DAY;end-=DAY;}
  if(period==="week"){start-=((new Date(localDay).getUTCDay()+6)%7)*DAY;end=start+7*DAY;group="day";}
  if(period==="month"){start=Date.UTC(y,m,1);end=Date.UTC(y,m+1,1);group="day";}
  if(period==="year"||period==="lastYear"){const year=y-(period==="lastYear"?1:0);start=Date.UTC(year,0,1);end=Date.UTC(year+1,0,1);group="month";}
  return {period,start:start+BUSINESS_DAY_OFFSET-TBILISI_OFFSET,end:end+BUSINESS_DAY_OFFSET-TBILISI_OFFSET,group};
}
export type StatPoint={key:string;label:string;fullLabel:string;orders:number;revenue:number;productSales:number;deliveryFees:number;cost:number|null;grossProfit:number|null};
export type StatSummary=Omit<StatPoint,"key"|"label"|"fullLabel"> & {units:number;averageOrder:number;margin:number|null;cash:number;terminal:number;web:number;pos:number;pickupOrders:number;deliveryOrders:number;missingCostOrders:number};
export type StatProduct={id:string;name:string;quantity:number;revenue:number;cost:number|null;grossProfit:number|null};
export type Statistics={range:StatRange;summary:StatSummary;points:StatPoint[];products:StatProduct[];undatedPayments:number;generatedAt:number;nextResetAt:number};
export function statisticBuckets(range:StatRange):StatPoint[] {
  const points:StatPoint[]=[];
  for(let t=range.start;t<range.end;){
    const local=new Date(t+TBILISI_OFFSET),iso=local.toISOString();
    const key=range.group==="hour"?iso.slice(0,13):range.group==="day"?iso.slice(0,10):iso.slice(0,7);
    const label=range.group==="hour"?`${iso.slice(11,13)}:00`:range.group==="day"?`${iso.slice(8,10)}.${iso.slice(5,7)}`:SHORT_MONTHS[local.getUTCMonth()];
    const fullLabel=range.group==="month"?`${MONTHS[local.getUTCMonth()]} ${local.getUTCFullYear()}`:`${statisticDate(t)}${range.group==="hour"?` · ${statisticTime(t)}`:""}`;
    points.push({key,label,fullLabel,orders:0,revenue:0,productSales:0,deliveryFees:0,cost:0,grossProfit:0});
    t=range.group==="month"?Date.UTC(local.getUTCFullYear(),local.getUTCMonth()+1,1)+BUSINESS_DAY_OFFSET-TBILISI_OFFSET:t+(range.group==="hour"?DAY/24:DAY);
  }
  return points;
}
