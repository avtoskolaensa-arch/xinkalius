import { getDb } from "@/db";
import { orderInput,priceOrder } from "@/lib/order-validation";
import { currentOwner,sameOrigin,publicOrder,apiError } from "@/lib/server";
export const dynamic="force-dynamic";
export async function GET(){
  const owner=await currentOwner();if(!owner)return Response.json({error:"საცდელი შეკვეთებისთვის საჭიროა შესვლა."},{status:401});
  try{const{results}=await getDb().prepare("SELECT * FROM orders WHERE owner_id = ? ORDER BY created_at DESC LIMIT 100").bind(owner).all();return Response.json({orders:results.map(publicOrder)},{headers:{"Cache-Control":"no-store"}});}catch(error){return apiError(error);}
}
export async function POST(request:Request){
  const owner=await currentOwner();if(!owner)return Response.json({error:"საცდელი შეკვეთებისთვის საჭიროა შესვლა."},{status:401});
  if(!sameOrigin(request))return Response.json({error:"მოთხოვნა ვერ დადასტურდა."},{status:403});
  const raw=await request.text();if(raw.length>10000)return Response.json({error:"მოთხოვნა ზედმეტად დიდია."},{status:413});
  let body:unknown;try{body=JSON.parse(raw);}catch{return Response.json({error:"შეკვეთის ფორმატი არასწორია."},{status:400});}
  const parsed=orderInput.safeParse(body);if(!parsed.success)return Response.json({error:parsed.error.issues[0].message},{status:400});
  const input=parsed.data,totals=priceOrder(input),now=Date.now();
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify(input)));
  const hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
  try{
    const db=getDb();
    await db.prepare("INSERT INTO orders (id,owner_id,request_key,request_hash,customer_name,phone,address,note,fulfillment,items_json,subtotal,delivery_fee,total,status,payment_status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'received','demo_unpaid',?,?) ON CONFLICT(owner_id,request_key) DO NOTHING").bind(crypto.randomUUID(),owner,input.requestKey,hash,input.name,input.phone,input.fulfillment==="delivery"?input.address:"გატანა",input.note,input.fulfillment,JSON.stringify(totals.items),totals.subtotal,totals.deliveryFee,totals.total,now,now).run();
    const order=await db.prepare("SELECT * FROM orders WHERE owner_id = ? AND request_key = ?").bind(owner,input.requestKey).first();
    if(!order)throw new Error("Order was not saved");
    if(order.request_hash!==hash)return Response.json({error:"ეს შეკვეთა უკვე გაიგზავნა სხვა მონაცემებით. გახსენი კალათა თავიდან."},{status:409});
    return Response.json({order:publicOrder(order),demo:true},{status:201,headers:{"Cache-Control":"no-store"}});
  }catch(error){return apiError(error);}
}
