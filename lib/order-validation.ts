import { z } from "zod";
import { type Product,type Settings,isOpen } from "./menu";
export const orderInput=z.object({requestKey:z.string().uuid(),name:z.string().trim().max(80),phone:z.string().trim().max(30).transform(v=>v.replace(/[\s()-]/g,"")),address:z.string().trim().max(250),note:z.string().trim().max(500),fulfillment:z.enum(["delivery","pickup"]),source:z.enum(["web","pos"]).default("web"),paymentMethod:z.enum(["cash","terminal"]),expectedTotal:z.number().int().min(0),items:z.array(z.object({id:z.string().min(1).max(180),quantity:z.number().int().min(1).max(200)}).strict()).min(1).max(100)}).strict().superRefine((v,c)=>{
 if(v.source==="web"&&v.name.length<2)c.addIssue({code:"custom",message:"მიუთითე სახელი.",path:["name"]});
 if(v.source==="web"&&!/^\+?[0-9]{8,15}$/.test(v.phone))c.addIssue({code:"custom",message:"მიუთითე სწორი ტელეფონის ნომერი.",path:["phone"]});
 if(v.fulfillment==="delivery"&&v.address.length<5)c.addIssue({code:"custom",message:"მიუთითე სრული მისამართი.",path:["address"]});
 if(v.source==="pos"&&v.fulfillment!=="pickup")c.addIssue({code:"custom",message:"სალაროს შეკვეთა გასატანია.",path:["fulfillment"]});
 if(v.source==="web"&&v.paymentMethod!=="cash")c.addIssue({code:"custom",message:"ონლაინ გადახდა ჯერ არ არის ჩართული.",path:["paymentMethod"]});
 if(new Set(v.items.map(i=>i.id)).size!==v.items.length)c.addIssue({code:"custom",message:"პროდუქტი მეორდება.",path:["items"]});
 if(v.items.reduce((a,b)=>a+b.quantity,0)>500)c.addIssue({code:"custom",message:"მაქსიმუმ 500 ერთეული ერთ შეკვეთაში.",path:["items"]});
});
export function calculateOrder(input:z.infer<typeof orderInput>,products:Product[],settings:Settings){
 if(input.source==="web"&&!isOpen(settings))throw new Error("შეკვეთების მიღება დროებით შეჩერებულია.");
 const items=input.items.map(i=>{const p=products.find(p=>p.id===i.id);if(!p||!p.available)throw new Error("ერთ-ერთი პროდუქტი ამოიწურა. განაახლე კალათა.");if(i.quantity<p.minQuantity)throw new Error(`${p.name}: მინიმუმ ${p.minQuantity} ცალი.`);return{id:p.id,name:p.name,quantity:i.quantity,price:p.price,cost:p.cost??0};});
 const subtotal=items.reduce((s,i)=>s+i.quantity*i.price,0);if(input.source==="web"&&subtotal<settings.minimumOrder)throw new Error(`მინიმალური შეკვეთა ${(settings.minimumOrder/100).toFixed(2)} ₾.`);
 const deliveryFee=input.fulfillment==="delivery"?settings.deliveryFee:0;return{items,subtotal,deliveryFee,total:subtotal+deliveryFee};
}
export const transitions:Record<string,string[]>={received:["cooking","cancelled"],cooking:["ready","cancelled"],ready:["delivering","completed","cancelled"],delivering:["completed","cancelled"],completed:[],cancelled:[]};
export const productInput=z.object({name:z.string().trim().min(2).max(80),description:z.string().trim().max(200),ingredients:z.string().trim().max(500),allergens:z.string().trim().max(250),category:z.enum(["khinkali","sauce","drink"]),price:z.number().int().min(1).max(1000000),cost:z.number().int().min(0).max(1000000),image:z.string().refine(s=>s==="/khinkali.png"||s===""||/^\/api\/images\/[0-9a-f-]{36}$/.test(s),"ფოტო ატვირთე მოწყობილობიდან."),available:z.boolean(),minQuantity:z.number().int().min(1).max(200)}).strict();
export const settingsInput=z.object({accepting:z.boolean(),enforceHours:z.boolean(),openTime:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),closeTime:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),prepMinutes:z.number().int().min(5).max(180),deliveryMinutes:z.number().int().min(0).max(180),deliveryFee:z.number().int().min(0).max(100000),minimumOrder:z.number().int().min(0).max(100000),address:z.string().trim().max(250),phone:z.string().trim().max(30),deliveryArea:z.string().trim().max(250),notice:z.string().trim().max(250)}).strict();
