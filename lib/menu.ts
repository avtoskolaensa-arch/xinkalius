export const MENU = [
  { id: "kalakuri", name: "ქალაქური", label: "კლასიკური", description: "ხორცი, მწვანილი და წვნიანი გულსართი.", ingredients: "საქონლისა და ღორის ხორცი, ხახვი, ქინძი", price: 180, color: "#dc3328", type: "meat" },
  { id: "mtiuluri", name: "მთიულური", label: "უმწვანილოდ", description: "ხორცის გამოკვეთილი გემო, ზედმეტის გარეშე.", ingredients: "საქონლისა და ღორის ხორცი, ხახვი, ძირა", price: 190, color: "#bd4b24", type: "meat" },
  { id: "cheese", name: "ყველის", label: "ნაზი", description: "რბილი ცომი და თბილი, ყველიანი გული.", ingredients: "ყველის ნაზავი, ცომი", price: 210, color: "#d49b15", type: "vegetarian" },
  { id: "mushroom", name: "სოკოს", label: "მცენარეული", description: "არომატული სოკო და მსუბუქი სანელებლები.", ingredients: "სოკო, ხახვი, შავი პილპილი", price: 170, color: "#526d48", type: "vegetarian" },
] as const;
export const DELIVERY_FEE = 400;
export const money = (tetri: number) => `${(tetri / 100).toFixed(2)} ₾`;
export const STATUS_LABELS: Record<string,string> = { received:"მიღებულია", cooking:"მზადდება", ready:"მზადაა", delivering:"გზაშია", completed:"დასრულებულია", cancelled:"გაუქმებულია" };
export type Cart = Record<string,number>;
export type Order = { id:string; customer_name:string; phone:string; address:string; note:string; fulfillment:"delivery"|"pickup"; items:{id:string;name:string;quantity:number;price:number}[]; subtotal:number; delivery_fee:number; total:number; status:string; payment_status:string; created_at:number; updated_at:number };
