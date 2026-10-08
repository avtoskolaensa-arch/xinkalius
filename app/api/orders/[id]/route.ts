import { getDb } from "@/db";
import { transitions } from "@/lib/order-validation";
import { currentOwner,sameOrigin,publicOrder,apiError } from "@/lib/server";
export const dynamic="force-dynamic";
export async function PATCH(request:Request,context:{params:Promise<{id:string}>}){
  const owner=await currentOwner();if(!owner)return Response.json({error:"შესვლა აუცილებელია."},{status:401});
  if(!sameOrigin(request))return Response.json({error:"მოთხოვნა ვერ დადასტურდა."},{status:403});
  let body:{status?:unknown};try{body=await request.json();}catch{return Response.json({error:"მონაცემები არასწორია."},{status:400});}
  if(typeof body.status!=="string"||!Object.hasOwn(transitions,body.status))return Response.json({error:"სტატუსი არასწორია."},{status:400});
  const{id}=await context.params;
  try{
    const db=getDb(),order=await db.prepare("SELECT * FROM orders WHERE id = ? AND owner_id = ?").bind(id,owner).first();
    if(!order)return Response.json({error:"შეკვეთა ვერ მოიძებნა."},{status:404});
    if(!transitions[String(order.status)]?.includes(body.status)||(order.fulfillment==="pickup"&&body.status==="delivering"))return Response.json({error:"სტატუსი უკვე შეიცვალა. განაახლე გვერდი."},{status:409});
    const result=await db.prepare("UPDATE orders SET status = ?, updated_at = ? WHERE id = ? AND owner_id = ? AND status = ?").bind(body.status,Date.now(),id,owner,order.status).run();
    if(!result.meta.changes)return Response.json({error:"შეკვეთა შეიცვალა. განაახლე გვერდი."},{status:409});
    const updated=await db.prepare("SELECT * FROM orders WHERE id = ? AND owner_id = ?").bind(id,owner).first();
    return Response.json({order:publicOrder(updated!)});
  }catch(error){return apiError(error);}
}
