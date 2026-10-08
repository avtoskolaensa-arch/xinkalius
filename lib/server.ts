import { getChatGPTUser } from "@/app/chatgpt-auth";
export async function currentOwner(){return(await getChatGPTUser())?.userId??null;}
export function sameOrigin(request:Request){const origin=request.headers.get("origin");return!!origin&&origin===new URL(request.url).origin;}
export function publicOrder(row:Record<string,unknown>){const{owner_id,request_key,request_hash,items_json,...fields}=row;return{...fields,items:JSON.parse(String(items_json))};}
export function apiError(error:unknown){console.error("Order storage operation failed",error instanceof Error?error.message:"unknown");return Response.json({error:"შეკვეთების სერვისი დროებით მიუწვდომელია. სცადე ხელახლა."},{status:503});}
