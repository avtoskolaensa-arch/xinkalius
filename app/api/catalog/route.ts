import {currentOwner,getCatalog,apiError,fail} from "@/lib/server";
export const dynamic="force-dynamic";
export async function GET(){const owner=await currentOwner();if(!owner)return fail("საცდელი სივრცისთვის საჭიროა შესვლა.",401);try{return Response.json(await getCatalog(owner),{headers:{"Cache-Control":"no-store"}});}catch(e){return apiError(e);}}
