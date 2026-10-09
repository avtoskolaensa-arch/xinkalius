import {COLLECT_DRAWER_SQL} from "@/lib/finance";
import {getDb} from "@/db";
import {transitions} from "@/lib/order-validation";
import {currentOwner,apiError,fail,sameOrigin,readBody,publicOrder} from "@/lib/server";
export const dynamic="force-dynamic";
export async function GET(request:Request,context:{params:Promise<{id:string}>}){void request;const owner=await currentOwner();if(!owner)return fail("შესვლა აუცილებელია.",401);try{const{id}=await context.params;const r=await getDb().prepare("SELECT * FROM orders WHERE id=? AND owner_id=?").bind(id,owner).first();if(!r)return fail("შეკვეთა ვერ მოიძებნა.",404);return Response.json({order:publicOrder(r)},{headers:{"Cache-Control":"no-store"}});}catch(e){return apiError(e);}}
export async function PATCH(request:Request,context:{params:Promise<{id:string}>}){
 const owner=await currentOwner();if(!owner)return fail("შესვლა აუცილებელია.",401);if(!sameOrigin(request))return fail("მოთხოვნა ვერ დადასტურდა.",403);let b;try{b=await readBody(request,1500);}catch{return fail("მონაცემები არასწორია.");}
 if(!b||typeof b!=="object"||Array.isArray(b))return fail("მონაცემები არასწორია.");
 const{id}=await context.params;try{const db=getDb();const o=await db.prepare("SELECT * FROM orders WHERE id=? AND owner_id=?").bind(id,owner).first();if(!o)return fail("შეკვეთა ვერ მოიძებნა.",404);
  let result;if(b.action==="collect"){
   if(o.status==="cancelled"||!["cash_due","terminal_due"].includes(String(o.payment_status)))return fail("გადახდის მდგომარეობა უკვე შეიცვალა.",409);
   const cash=o.payment_method==="cash";if(cash&&(!Number.isInteger(b.cashReceived)||b.cashReceived<Number(o.total)||b.cashReceived>10000000))return fail("მიღებული თანხა ჯამზე ნაკლებია ან არასწორია.");
   const destination=b.cashDestination??"drawer";if(cash&&!["drawer","courier"].includes(destination))return fail("აირჩიე თანხის მდებარეობა.");const now=Date.now();
   if(cash&&destination==="drawer"){result=await db.prepare(COLLECT_DRAWER_SQL).bind(b.cashReceived,now,now,owner,id,owner,o.status,owner).run();if(!result.meta.changes)return fail("ჯერ გახსენი სალაროს ცვლა ან განაახლე შეკვეთა.",409);}
   else result=await db.prepare("UPDATE orders SET payment_status=?,cash_received=?,cash_destination=?,updated_at=?,payment_collected_at=? WHERE id=? AND owner_id=? AND payment_status=? AND status=?").bind(cash?"cash_collected":"terminal_collected",cash?b.cashReceived:null,cash?"courier":"terminal",now,now,id,owner,o.payment_status,o.status).run();
  }else if(b.action==="status"){
   if(typeof b.status!=="string"||!transitions[String(o.status)]?.includes(b.status)||(o.fulfillment==="pickup"&&b.status==="delivering")||(o.fulfillment==="delivery"&&o.status==="ready"&&b.status==="completed"))return fail("სტატუსის ცვლილება დაუშვებელია. განაახლე სია.",409);
   if(b.status==="completed"&&!["cash_collected","terminal_collected"].includes(String(o.payment_status)))return fail("დასრულებამდე დაადასტურე თანხის მიღება.",409);
   if(b.status==="cancelled"&&["cash_collected","terminal_collected"].includes(String(o.payment_status)))return fail("თანხა უკვე აღრიცხულია. დაბრუნების ფუნქცია ჯერ არ არის ჩართული.",409);
   result=await db.prepare("UPDATE orders SET status=?,updated_at=? WHERE id=? AND owner_id=? AND status=? AND payment_status=?").bind(b.status,Date.now(),id,owner,o.status,o.payment_status).run();
  }else return fail("მოქმედება არასწორია.");
  if(!result.meta.changes)return fail("შეკვეთა სხვა ფანჯარაში შეიცვალა. განაახლე.",409);const updated=await db.prepare("SELECT * FROM orders WHERE id=? AND owner_id=?").bind(id,owner).first();return Response.json({order:publicOrder(updated!,true)});
 }catch(e){return apiError(e);}
}
