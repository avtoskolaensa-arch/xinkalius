import {getDb} from "@/db";
import {orderInput,calculateOrder} from "@/lib/order-validation";
import {currentOwner,getCatalog,apiError,fail,sameOrigin,readBody,publicOrder} from "@/lib/server";
export const dynamic="force-dynamic";
export async function GET(){const owner=await currentOwner();if(!owner)return fail("საცდელი სივრცისთვის საჭიროა შესვლა.",401);try{const r=await getDb().prepare("SELECT * FROM orders WHERE owner_id=? AND source='web' ORDER BY created_at DESC LIMIT 100").bind(owner).all();return Response.json({orders:r.results.map(r=>publicOrder(r))},{headers:{"Cache-Control":"no-store"}});}catch(e){return apiError(e);}}
export async function POST(request:Request){
 const owner=await currentOwner();if(!owner)return fail("საცდელი სივრცისთვის საჭიროა შესვლა.",401);if(!sameOrigin(request))return fail("მოთხოვნა ვერ დადასტურდა.",403);
 let parsed;try{parsed=orderInput.safeParse(await readBody(request));}catch{return fail("მონაცემები არასწორია.");}if(!parsed.success)return fail(parsed.error.issues[0].message);
 const input=parsed.data;try{
  const db=getDb();const hash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify({...input,items:[...input.items].sort((a,b)=>a.id.localeCompare(b.id))}))))).map(v=>v.toString(16).padStart(2,"0")).join("");
  const previous=await db.prepare("SELECT * FROM orders WHERE owner_id=? AND request_key=?").bind(owner,input.requestKey).first();if(previous){if(previous.request_hash!==hash)return fail("ეს მცდელობა უკვე გამოყენებულია. განაახლე კალათა.",409);return Response.json({order:publicOrder(previous),demo:true});}
  const catalog=await getCatalog(owner,true);let totals;try{totals=calculateOrder(input,catalog.products,catalog.settings);}catch(e){return fail((e as Error).message,409);}if(totals.total!==input.expectedTotal)return fail("ფასი შეიცვალა. განაახლე კალათა და გადაამოწმე ჯამი.",409);
  const now=Date.now();await db.prepare("INSERT INTO orders (id,owner_id,request_key,request_hash,customer_name,phone,address,note,fulfillment,items_json,subtotal,delivery_fee,total,status,payment_status,created_at,updated_at,payment_method,source,prep_minutes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'received',?,?,?,?,?,?) ON CONFLICT(owner_id,request_key) DO NOTHING").bind(crypto.randomUUID(),owner,input.requestKey,hash,input.name||"ადგილზე სტუმარი",input.phone,input.fulfillment==="pickup"?"გატანა":input.address,input.note,input.fulfillment,JSON.stringify(totals.items),totals.subtotal,totals.deliveryFee,totals.total,input.paymentMethod==="cash"?"cash_due":"terminal_due",now,now,input.paymentMethod,input.source,catalog.settings.prepMinutes+(input.fulfillment==="delivery"?catalog.settings.deliveryMinutes:0)).run();
  const order=await db.prepare("SELECT * FROM orders WHERE owner_id=? AND request_key=?").bind(owner,input.requestKey).first();if(!order||order.request_hash!==hash)return fail("მცდელობა უკვე გამოყენებულია. განაახლე კალათა.",409);return Response.json({order:publicOrder(order),demo:true},{status:201,headers:{"Cache-Control":"no-store"}});
 }catch(e){return apiError(e);}
}
