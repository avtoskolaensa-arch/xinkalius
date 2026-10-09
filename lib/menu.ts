export type Product = {id:string; name:string; description:string; ingredients:string; allergens:string; category:string; price:number; cost?:number; image:string; available:boolean; minQuantity:number; updatedAt:number};
export type Settings = {accepting:boolean; enforceHours:boolean; openTime:string; closeTime:string; prepMinutes:number; deliveryMinutes:number; deliveryFee:number; minimumOrder:number; address:string; phone:string; deliveryArea:string; notice:string};
export type Cart = Record<string,number>;
export type OrderItem = {id:string;name:string;quantity:number;price:number;cost?:number};
export type Order = {id:string;customer_name:string;phone:string;address:string;note:string;fulfillment:"delivery"|"pickup";items:OrderItem[];subtotal:number;delivery_fee:number;total:number;status:string;payment_status:string;payment_method:string;source:string;prep_minutes:number;created_at:number;updated_at:number;cash_received:number|null};
export const money=(tetri:number)=>`${(tetri/100).toFixed(2)} ₾`;
export const CATEGORIES:Record<string,string>={khinkali:"ხინკალი",sauce:"სოუსები",drink:"სასმელები"};
export const STATUS_LABELS:Record<string,string>={received:"მიღებულია",cooking:"მზადდება",ready:"მზადაა",delivering:"გზაშია",completed:"დასრულებულია",cancelled:"გაუქმებულია"};
export const PAYMENT_LABELS:Record<string,string>={demo_unpaid:"საცდელი · გადაუხდელი",cash_due:"ნაღდი · მისაღებია",cash_collected:"ნაღდი · მიღებულია",terminal_due:"ტერმინალი · დასადასტურებელია",terminal_collected:"ტერმინალი · დადასტურებულია"};
export const DEFAULT_SETTINGS:Settings={accepting:true,enforceHours:false,openTime:"11:00",closeTime:"23:00",prepMinutes:25,deliveryMinutes:20,deliveryFee:400,minimumOrder:0,address:"",phone:"",deliveryArea:"ბათუმი · საცდელი მიტანა",notice:"მენიუ, ფასები და ფოტოები საილუსტრაციოა."};
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
