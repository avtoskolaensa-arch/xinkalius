import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(), ownerId: text("owner_id").notNull(),
  requestKey: text("request_key").notNull(), requestHash: text("request_hash").notNull(),
  customerName: text("customer_name").notNull(), phone: text("phone").notNull(),
  address: text("address").notNull(), note: text("note").notNull(), fulfillment: text("fulfillment").notNull(),
  itemsJson: text("items_json").notNull(), subtotal: integer("subtotal").notNull(),
  deliveryFee: integer("delivery_fee").notNull(), total: integer("total").notNull(),
  status: text("status").notNull().default("received"),
  paymentStatus: text("payment_status").notNull().default("demo_unpaid"),
  createdAt: integer("created_at").notNull(), updatedAt: integer("updated_at").notNull(),
}, t => [uniqueIndex("idx_orders_owner_request").on(t.ownerId,t.requestKey), index("idx_orders_owner_created").on(t.ownerId,t.createdAt)]);
