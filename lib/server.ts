import {translate} from "./i18n-core";
import {QUEUE_SQL,preparation} from "./operations";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { DEFAULT_SETTINGS,SAMPLE_PRODUCTS,type Product,type Settings } from "./menu";
export async function currentOwner(){return(await getChatGPTUser())?.userId??null;}
export function sameOrigin(request:Request){const origin=request.headers.get("origin");return!!origin&&origin===new URL(request.url).origin;}
export function fail(error:string,status=400){return Response.json({error},{status,headers:{"Cache-Control":"no-store"}});}
export function apiError(error:unknown){console.error("Storage operation failed",error instanceof Error?error.message:"unknown");return fail("სერვისი დროებით მიუწვდომელია. სცადე ხელახლა.",503);}
export async function readBody(request:Request,max=20000){const raw=await request.text();if(raw.length>max)throw new Error("მონაცემების ზომა დასაშვებს აჭარბებს.");return JSON.parse(raw);}
export function publicOrder(row:Record<string,unknown>,admin=false){const{owner_id,request_key,request_hash,items_json,...fields}=row;void owner_id;void request_key;void request_hash;const items=JSON.parse(String(items_json));return{...fields,items:admin?items:items.map(({cost,...item}:{cost?:number;[key:string]:unknown})=>{void cost;return item;})};}
export function productRow(row:Record<string,unknown>,admin=false):Product{
 return{translations:Object.fromEntries((["en","ru"] as const).map(locale=>{const saved=JSON.parse(String(row.translations||"{}"))[locale];return[locale,saved||Object.fromEntries(["name","description","ingredients","allergens"].map(field=>[field,translate(String(row[field]),locale)]))];})) as Product["translations"],id:String(row.id),name:String(row.name),description:String(row.description),ingredients:String(row.ingredients),allergens:String(row.allergens),category:String(row.category),price:Number(row.price),...(admin?{cost:Number(row.cost)}:{}),image:String(row.image),available:!!row.available,minQuantity:Number(row.min_quantity),updatedAt:Number(row.updated_at)};
}
export async function ensureStore(owner:string){
 const db=getDb();const existing=await db.prepare("SELECT owner_id FROM store_settings WHERE owner_id = ?").bind(owner).first();if(existing)return;
 const now=Date.now();const statements=SAMPLE_PRODUCTS.map((p,i)=>db.prepare("INSERT OR IGNORE INTO products (id,owner_id,name,description,ingredients,allergens,category,price,cost,image,available,min_quantity,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(`${owner}-sample-${i}`,owner,p.name,p.description,p.ingredients,p.allergens,p.category,p.price,p.cost,p.image,1,p.minQuantity,now));
 statements.push(db.prepare("INSERT OR IGNORE INTO store_settings (owner_id,value,updated_at) VALUES (?,?,?)").bind(owner,JSON.stringify(DEFAULT_SETTINGS),now));await db.batch(statements);
}
export async function getCatalog(owner:string,admin=false){await ensureStore(owner);const db=getDb();const result=await db.prepare("SELECT * FROM products WHERE owner_id = ? ORDER BY rowid").bind(owner).all();const setting=await db.prepare("SELECT value FROM store_settings WHERE owner_id = ?").bind(owner).first<{value:string}>();const settings={...DEFAULT_SETTINGS,...JSON.parse(setting?.value||"{}")} as Settings;const queued=await db.prepare(QUEUE_SQL).bind(owner).first<{units:number}>();return{products:result.results.map(r=>productRow(r,admin)),settings,workload:{units:Number(queued?.units||0),prepMinutes:preparation(settings,Number(queued?.units||0))}};}

export async function payloadHash(value:unknown){return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify(value))))).map(v=>v.toString(16).padStart(2,"0")).join("");}
