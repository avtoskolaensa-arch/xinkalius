export type Locale="ka"|"en"|"ru";
export type ProductText={name:string;description:string;ingredients:string;allergens:string};
export type Point={lat:number;lng:number};
export type DeliveryZone={id:string;name:string;nameEn:string;nameRu:string;enabled:boolean;fee:number;minutes:number;minimum:number;polygon:Point[]};
export type Product = {id:string; name:string; description:string; ingredients:string; allergens:string; category:string; price:number; cost?:number; image:string; available:boolean; minQuantity:number; updatedAt:number;translations?:{en:ProductText;ru:ProductText}};
export type Settings = {accepting:boolean; enforceHours:boolean; openTime:string; closeTime:string; prepMinutes:number; deliveryMinutes:number; deliveryFee:number; minimumOrder:number; address:string; phone:string; deliveryArea:string; notice:string;translations?:Record<"en"|"ru",{address:string;deliveryArea:string;notice:string}>;zones:DeliveryZone[];loadEnabled:boolean;capacity:number;batchMinutes:number};
export type Cart = Record<string,number>;
export type OrderItem = {id:string;name:string;quantity:number;price:number;cost?:number;category?:string;translations?:{en:ProductText;ru:ProductText}};
export type Order = {id:string;customer_name:string;phone:string;address:string;note:string;fulfillment:"delivery"|"pickup";items:OrderItem[];subtotal:number;delivery_fee:number;total:number;status:string;payment_status:string;payment_method:string;source:string;prep_minutes:number;created_at:number;updated_at:number;cash_received:number|null;delivery_lat?:number|null;delivery_lng?:number|null;zone_name?:string;zone_name_en?:string;zone_name_ru?:string;travel_minutes?:number;cash_destination?:string;shift_id?:string|null};
export const money=(tetri:number)=>`${(tetri/100).toFixed(2)} ₾`;
export const CATEGORIES:Record<string,string>={khinkali:"ხინკალი",sauce:"სოუსები",drink:"სასმელები"};
export const STATUS_LABELS:Record<string,string>={received:"მიღებულია",cooking:"მზადდება",ready:"მზადაა",delivering:"გზაშია",completed:"დასრულებულია",cancelled:"გაუქმებულია"};
export const PAYMENT_LABELS:Record<string,string>={demo_unpaid:"საცდელი · გადაუხდელი",cash_due:"ნაღდი · მისაღებია",cash_collected:"ნაღდი · მიღებულია",terminal_due:"ტერმინალი · დასადასტურებელია",terminal_collected:"ტერმინალი · დადასტურებულია"};
export const DEFAULT_SETTINGS:Settings={accepting:true,enforceHours:false,openTime:"11:00",closeTime:"23:00",prepMinutes:25,deliveryMinutes:20,deliveryFee:400,minimumOrder:0,address:"",phone:"",deliveryArea:"ბათუმი · საცდელი მიტანა",notice:"მენიუ, ფასები და ფოტოები საილუსტრაციოა.",loadEnabled:true,capacity:60,batchMinutes:15,zones:[{id:"old-batumi",name:"ძველი ბათუმი · სატესტო",nameEn:"Old Batumi · test",nameRu:"Старый Батуми · тест",enabled:true,fee:400,minutes:15,minimum:0,polygon:[{lat:41.660,lng:41.635},{lat:41.649,lng:41.626},{lat:41.641,lng:41.641},{lat:41.653,lng:41.649}]},{id:"center",name:"ცენტრი · სატესტო",nameEn:"City centre · test",nameRu:"Центр · тест",enabled:true,fee:500,minutes:20,minimum:0,polygon:[{lat:41.649,lng:41.626},{lat:41.636,lng:41.611},{lat:41.627,lng:41.632},{lat:41.641,lng:41.641}]},{id:"new-boulevard",name:"ახალი ბულვარი · სატესტო",nameEn:"New Boulevard · test",nameRu:"Новый бульвар · тест",enabled:true,fee:700,minutes:30,minimum:0,polygon:[{lat:41.636,lng:41.611},{lat:41.617,lng:41.592},{lat:41.606,lng:41.614},{lat:41.627,lng:41.632}]}]};
export const SAMPLE_PRODUCTS:Omit<Product,"id"|"updatedAt">[]=[
{name:"ქალაქური",description:"წვნიანი კლასიკა, მწვანილით.",ingredients:"საქონლისა და ღორის ხორცი, ხახვი, ქინძი, ხორბლის ცომი",allergens:"ხორბალი (გლუტენი)",category:"khinkali",price:180,cost:90,image:"/khinkali.png",available:true,minQuantity:5},
{name:"მთიულური",description:"ხორცის გემო, მწვანილის გარეშე.",ingredients:"საქონლისა და ღორის ხორცი, ხახვი, სანელებლები, ხორბლის ცომი",allergens:"ხორბალი (გლუტენი)",category:"khinkali",price:190,cost:95,image:"/khinkali.png",available:true,minQuantity:5},
{name:"ყველის",description:"ნაზი, ყველიანი გულსართი.",ingredients:"ყველის ნაზავი, ხორბლის ცომი",allergens:"რძე, ხორბალი (გლუტენი)",category:"khinkali",price:210,cost:100,image:"/khinkali.png",available:true,minQuantity:5},
{name:"სოკოს",description:"არომატული სოკო და სანელებლები.",ingredients:"სოკო, ხახვი, პილპილი, ხორბლის ცომი",allergens:"ხორბალი (გლუტენი)",category:"khinkali",price:170,cost:80,image:"/khinkali.png",available:true,minQuantity:5},
];
export function isOpen(s:Settings,now=new Date()){
 if(!s.accepting)return false;if(!s.enforceHours)return true;
 const time=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Tbilisi",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(now);
 if(s.openTime===s.closeTime)return true;
 return s.openTime<s.closeTime?time>=s.openTime&&time<s.closeTime:time>=s.openTime||time<s.closeTime;
}
export const nextStatus=(o:Order)=>o.status==="received"?"cooking":o.status==="cooking"?"ready":o.status==="ready"&&o.fulfillment==="delivery"?"delivering":"completed";
