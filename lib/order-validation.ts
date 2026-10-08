import { z } from "zod";
import { MENU, DELIVERY_FEE } from "./menu";
export const orderInput = z.object({
  requestKey:z.string().uuid(), name:z.string().trim().min(2,"მიუთითე სახელი.").max(80),
  phone:z.string().trim().transform(v=>v.replace(/[\s()-]/g,"")).refine(v=>/^(?:\+995|995)?5\d{8}$/.test(v),"მიუთითე ქართული მობილურის ნომერი."),
  address:z.string().trim().max(250), note:z.string().trim().max(500), fulfillment:z.enum(["delivery","pickup"]),
  items:z.array(z.object({id:z.string(),quantity:z.number().int().min(5).max(100)}).strict()).min(1).max(4),
}).strict().superRefine((v,ctx)=>{
  if(v.fulfillment==="delivery"&&v.address.length<5) ctx.addIssue({code:"custom",message:"მიუთითე მიტანის სრული მისამართი.",path:["address"]});
  if(new Set(v.items.map(i=>i.id)).size!==v.items.length) ctx.addIssue({code:"custom",message:"პროდუქტი კალათაში დუბლირებულია."});
  if(v.items.some(i=>!MENU.some(m=>m.id===i.id))) ctx.addIssue({code:"custom",message:"მენიუში ასეთი პროდუქტი არ არის."});
  if(v.items.reduce((s,i)=>s+i.quantity,0)>200) ctx.addIssue({code:"custom",message:"საცდელი შეკვეთის ლიმიტია 200 ცალი."});
});
export function priceOrder(input:z.infer<typeof orderInput>) {
  const items=input.items.map(i=>{const menu=MENU.find(m=>m.id===i.id)!;return{id:i.id,name:menu.name,quantity:i.quantity,price:menu.price};});
  const subtotal=items.reduce((s,i)=>s+i.price*i.quantity,0);
  const deliveryFee=input.fulfillment==="delivery"?DELIVERY_FEE:0;
  return{items,subtotal,deliveryFee,total:subtotal+deliveryFee};
}
export const transitions:Record<string,string[]>={received:["cooking","cancelled"],cooking:["ready","cancelled"],ready:["delivering","completed","cancelled"],delivering:["completed","cancelled"],completed:[],cancelled:[]};
