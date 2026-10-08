import { requireChatGPTUser } from "@/app/chatgpt-auth";
import Kitchen from "@/components/kitchen";
export const dynamic="force-dynamic";
export default async function Admin(){await requireChatGPTUser("/admin");return<Kitchen/>;}
