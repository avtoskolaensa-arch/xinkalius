import { env } from "cloudflare:workers";
export function getDb() {
  if (!env.DB) throw new Error("DB unavailable");
  return env.DB;
}
