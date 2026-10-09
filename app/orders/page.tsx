import {requireChatGPTUser} from "@/app/chatgpt-auth";
import OrderHistory from "@/components/order-history";
export const dynamic="force-dynamic";
export default async function Page(){await requireChatGPTUser("/orders");return <OrderHistory/>;}
