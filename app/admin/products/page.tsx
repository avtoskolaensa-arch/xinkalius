import {requireChatGPTUser} from "@/app/chatgpt-auth";
import ProductAdmin from "@/components/product-admin";
export const dynamic="force-dynamic";
export default async function Page(){await requireChatGPTUser("/admin/products");return <ProductAdmin/>;}
