import {getDb} from "@/db";
import {currentOwner,apiError,fail,publicOrder} from "@/lib/server";
import {statisticRange} from "@/lib/statistics";
import {KITCHEN_SUMMARY_SQL} from "@/lib/statistics-sql";
export const dynamic="force-dynamic";
export async function GET(){const owner=await currentOwner();if(!owner)return fail("შესვლა აუცილებელია.",401);try{const db=getDb();const r=await db.prepare("SELECT * FROM orders WHERE owner_id=? ORDER BY CASE WHEN status IN ('completed','cancelled') THEN 1 ELSE 0 END, created_at DESC LIMIT 300").bind(owner).all();const {start,end}=statisticRange("today");const summary=await db.prepare(KITCHEN_SUMMARY_SQL).bind(start,end,start,end,start,end,owner).first();return Response.json({orders:r.results.map(r=>publicOrder(r,true)),summary},{headers:{"Cache-Control":"no-store"}});}catch(e){return apiError(e);}}
