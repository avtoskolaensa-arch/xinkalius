import {requireChatGPTUser} from "@/app/chatgpt-auth";
import SettingsAdmin from "@/components/settings-admin";
export const dynamic="force-dynamic";
export default async function Page(){await requireChatGPTUser("/admin/settings");return <SettingsAdmin/>;}
