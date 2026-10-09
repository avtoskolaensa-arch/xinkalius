import assert from 'node:assert/strict';
import {test} from 'node:test';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {statisticRange,statisticBuckets,isStatPeriod,statisticSqlOffset} from '../lib/statistics.ts';
import {SUMMARY_SQL,SERIES_SQL,PRODUCTS_SQL,UNDATED_SQL,KITCHEN_SUMMARY_SQL} from '../lib/statistics-sql.ts';
const now=new Date('2026-10-09T10:33:00Z');
const today=statisticRange('today',now);
const params=['owner-a',today.start,today.end];
function database(){const db=new DatabaseSync(':memory:');for(const file of readdirSync(new URL('../drizzle/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())db.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));return db;}
let serial=0;
function order(db,overrides={}){
 const id=String(++serial),items=overrides.items??[{id:'a',name:'ქალაქური',quantity:5,price:180,cost:90}];
 const subtotal=items.reduce((s,i)=>s+i.quantity*i.price,0);
 const row={id,owner_id:'owner-a',request_key:id,request_hash:id,customer_name:'Test',phone:'',address:'',note:'',fulfillment:'pickup',items_json:JSON.stringify(items),subtotal,delivery_fee:0,total:subtotal,status:'cooking',payment_status:'cash_collected',created_at:today.start-86400000,updated_at:today.end+1000,payment_method:'cash',source:'web',cash_received:10000,payment_collected_at:today.start,...overrides};
 delete row.items;const keys=Object.keys(row);db.prepare(`INSERT INTO orders (${keys.join(',')}) VALUES (${keys.map(()=>'?').join(',')})`).run(...Object.values(row));
}
function summary(db,p=params){return db.prepare(SUMMARY_SQL).get(...p);}
test('all six periods use 04:00 Tbilisi boundaries and Monday business weeks',()=>{
 const expected={today:['2026-10-09T00:00:00.000Z','2026-10-10T00:00:00.000Z',24],yesterday:['2026-10-08T00:00:00.000Z','2026-10-09T00:00:00.000Z',24],week:['2026-10-05T00:00:00.000Z','2026-10-12T00:00:00.000Z',7],month:['2026-10-01T00:00:00.000Z','2026-11-01T00:00:00.000Z',31],year:['2026-01-01T00:00:00.000Z','2027-01-01T00:00:00.000Z',12],lastYear:['2025-01-01T00:00:00.000Z','2026-01-01T00:00:00.000Z',12]};
 for(const [p,[start,end,count]] of Object.entries(expected)){const range=statisticRange(p,now);assert.equal(new Date(range.start).toISOString(),start);assert.equal(new Date(range.end).toISOString(),end);assert.equal(statisticBuckets(range).length,count);}
 assert.equal(isStatPeriod('injected'),false);assert.equal(isStatPeriod('today'),true);
 const hours=statisticBuckets(today);assert.equal(hours[0].label,'04:00');assert.equal(hours.at(-1).label,'03:00');assert.equal(hours.at(-1).key,'2026-10-10T03');assert.equal(new Set(hours.map(p=>p.key)).size,24);
});
test('millisecond before and exactly 04:00 switches business day, week, month and year',()=>{
 for(const [period,boundary,before,after] of [
 ['today','2026-10-10T04:00:00+04:00','2026-10-09','2026-10-10'],
 ['week','2026-10-12T04:00:00+04:00','2026-10-05','2026-10-12'],
 ['month','2026-11-01T04:00:00+04:00','2026-10-01','2026-11-01'],
 ['year','2027-01-01T04:00:00+04:00','2026-01-01','2027-01-01'],
 ['lastYear','2027-01-01T04:00:00+04:00','2025-01-01','2026-01-01'],
 ]){const at=new Date(boundary);assert.equal(new Date(statisticRange(period,new Date(at.getTime()-1)).start).toISOString(),before+'T00:00:00.000Z');assert.equal(new Date(statisticRange(period,at).start).toISOString(),after+'T00:00:00.000Z');}
 assert.equal(new Date(statisticRange('today',new Date('2026-10-10T02:00:00+04:00')).start).toISOString(),'2026-10-09T00:00:00.000Z');
 assert.equal(new Date(statisticRange('today',new Date('2026-10-10T00:00:00+04:00')).start).toISOString(),'2026-10-09T00:00:00.000Z');
 assert.equal(statisticBuckets(statisticRange('month',new Date('2024-03-01T03:00:00+04:00'))).length,29);
});
test('paid owner-scoped snapshot totals exclude unpaid, cancelled and outside dates; no line-join duplication or change included',()=>{
 const db=database();
 order(db,{items:[{id:'a',name:'ქალაქური',quantity:5,price:180,cost:90},{id:'b',name:'სასმელი',quantity:2,price:500,cost:300}],delivery_fee:400,total:2300,fulfillment:'delivery'});
 order(db,{items:[{id:'a',name:'ქალაქური',quantity:5,price:200,cost:100}],total:1000,payment_status:'terminal_collected',payment_method:'terminal',source:'pos',payment_collected_at:today.start+3600000});
 for(const row of [{owner_id:'owner-b'},{payment_status:'cash_due'},{payment_status:'demo_unpaid'},{status:'cancelled'},{payment_collected_at:today.start-1},{payment_collected_at:today.end},{payment_collected_at:null}])order(db,row);
 const s=summary(db);assert.equal(s.orders,2);assert.equal(s.revenue,3300);assert.equal(s.productSales,2900);assert.equal(s.deliveryFees,400);assert.equal(s.cost,1550);assert.equal(s.grossProfit,1350);assert.equal(s.units,12);assert.equal(s.cash,2300);assert.equal(s.terminal,1000);assert.equal(s.web+s.pos,s.revenue);assert.equal(s.pickupOrders+s.deliveryOrders,s.orders);assert.equal(s.missingCostOrders,0);
 const series=db.prepare(SERIES_SQL).all(...params,'%Y-%m-%dT%H',statisticSqlOffset('hour'));assert.equal(series[0].key,'2026-10-09T04');assert.equal(series.reduce((a,p)=>a+p.revenue,0),s.revenue);
 const products=db.prepare(PRODUCTS_SQL).all(...params);assert.equal(products[0].id,'a');assert.equal(products[0].revenue,1900);assert.equal(products[0].cost,950);assert.equal(products[0].quantity,10);assert.equal(products.reduce((a,p)=>a+p.grossProfit,0),s.grossProfit);
 assert.equal(db.prepare(UNDATED_SQL).get('owner-a').count,1);db.close();
});
test('zero cost is valid; absent cost is unknown without inflating profit',()=>{
 const db=database();order(db,{items:[{id:'free-cost',name:'Zero',quantity:1,price:100,cost:0}],total:100});assert.equal(summary(db).cost,0);assert.equal(summary(db).grossProfit,100);
 order(db,{items:[{id:'legacy',name:'Old',quantity:2,price:200}],total:400});const s=summary(db);assert.equal(s.revenue,500);assert.equal(s.cost,null);assert.equal(s.grossProfit,null);assert.equal(s.missingCostOrders,1);const products=db.prepare(PRODUCTS_SQL).all(...params);assert.equal(products.find(p=>p.id==='legacy').grossProfit,null);assert.equal(products.find(p=>p.id==='free-cost').grossProfit,100);db.close();
});
test('negative product profit is preserved and empty periods return zeros',()=>{
 const db=database();assert.equal(summary(db).orders,0);assert.equal(summary(db).cost,0);assert.equal(summary(db).grossProfit,0);order(db,{items:[{id:'a',name:'Loss',quantity:2,price:100,cost:200}],total:200});assert.equal(summary(db).grossProfit,-200);db.close();
});
test('statistics cover more than 300 orders and use collection index',()=>{
 const db=database();for(let i=0;i<351;i++)order(db);const s=summary(db);assert.equal(s.orders,351);assert.equal(s.revenue,351*900);assert.equal(s.cost,351*450);const plan=db.prepare('EXPLAIN QUERY PLAN '+SUMMARY_SQL).all(...params);assert.ok(plan.some(p=>p.detail.includes('idx_orders_owner_collected')));db.close();
});
test('malformed legacy line shapes keep turnover available but mark costs unknown',()=>{
 for(const items_json of ['invalid json','["legacy"]','{"name":"old"}','[]','[{"id":"a","name":"Old","price":100,"cost":20}]','[{"id":"a","name":"Old","price":100,"quantity":1,"cost":null}]']){
   const db=database();order(db,{items_json});const s=summary(db);assert.equal(s.revenue,900);assert.equal(s.cost,null);assert.equal(s.grossProfit,null);assert.equal(s.missingCostOrders,1);assert.doesNotThrow(()=>db.prepare(PRODUCTS_SQL).all(...params));db.close();
 }
});

test('after-midnight receipts stay in preceding day/month; hourly wall-clock keys still match',()=>{
 const db=database();
 const before=new Date('2027-01-01T03:59:59.999+04:00').getTime();
 const at=new Date('2027-01-01T04:00:00+04:00').getTime();
 order(db,{payment_collected_at:before});order(db,{payment_collected_at:at});
 for(const [period,group,pattern,key] of [['month','day','%Y-%m-%d','2026-12-31'],['year','month','%Y-%m','2026-12']]){
   const range=statisticRange(period,new Date(before));const rows=db.prepare(SERIES_SQL).all('owner-a',range.start,range.end,pattern,statisticSqlOffset(group));
   assert.equal(rows.length,1);assert.equal(rows[0].key,key);assert.equal(rows[0].revenue,900);assert.equal(summary(db,['owner-a',range.start,range.end]).revenue,rows.reduce((s,p)=>s+p.revenue,0));assert.ok(statisticBuckets(range).some(p=>p.key===key));
 }
 const range=statisticRange('today',new Date(before));const hours=db.prepare(SERIES_SQL).all('owner-a',range.start,range.end,'%Y-%m-%dT%H',statisticSqlOffset('hour'));assert.equal(hours[0].key,'2027-01-01T03');assert.ok(statisticBuckets(range).some(p=>p.key===hours[0].key));db.close();
});
test('kitchen daily totals roll at 04:00 while active orders and records remain',()=>{
 const db=database();order(db,{created_at:today.start,payment_collected_at:today.end-1});order(db,{created_at:today.end,payment_collected_at:today.end,payment_status:'terminal_collected',payment_method:'terminal'});
 const read=range=>db.prepare(KITCHEN_SUMMARY_SQL).get(range.start,range.end,range.start,range.end,range.start,range.end,'owner-a');
 const before=read(today),after=read(statisticRange('today',new Date(today.end)));
 assert.equal(before.cash,900);assert.equal(before.terminal,0);assert.equal(after.cash,0);assert.equal(after.terminal,900);assert.equal(before.today_count,1);assert.equal(after.today_count,1);assert.equal(before.active,2);assert.equal(after.active,2);assert.equal(db.prepare('SELECT COUNT(*) AS count FROM orders').get().count,2);db.close();
});
