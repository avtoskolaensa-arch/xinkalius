import {getDb} from "@/db";
import {settingsInput} from "@/lib/order-validation";
import {currentOwner,apiError,fail,sameOrigin,readBody,ensureStore} from "@/lib/server";
export const dynamic="force-dynamic";
export async function PUT(request:Request){const owner=await currentOwner();if(!owner)return fail("შესვლა აუცილებელია.",401);if(!sameOrigin(request))return fail("მოთხოვნა ვერ დადასტურდა.",403);let p;try{p=settingsInput.safeParse(await readBody(request));}catch{return fail("მონაცემები არასწორია.");}if(!p.success)return fail("შეამოწმე დრო, ფასები და ველები.");try{await ensureStore(owner);await getDb().prepare("UPDATE store_settings SET value=?,updated_at=? WHERE owner_id=?").bind(JSON.stringify(p.data),Date.now(),owner).run();return Response.json({settings:p.data});}catch(e){return apiError(e);}}
