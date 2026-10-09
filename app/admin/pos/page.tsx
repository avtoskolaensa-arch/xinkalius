import {requireChatGPTUser} from "@/app/chatgpt-auth";
import Pos from "@/components/pos";
export const dynamic="force-dynamic";
export default async function Page(){await requireChatGPTUser("/admin/pos");return <Pos/>;}
