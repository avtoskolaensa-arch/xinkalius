CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`request_key` text NOT NULL,
	`request_hash` text NOT NULL,
	`customer_name` text NOT NULL,
	`phone` text NOT NULL,
	`address` text NOT NULL,
	`note` text NOT NULL,
	`fulfillment` text NOT NULL,
	`items_json` text NOT NULL,
	`subtotal` integer NOT NULL,
	`delivery_fee` integer NOT NULL,
	`total` integer NOT NULL,
	`status` text DEFAULT 'received' NOT NULL,
	`payment_status` text DEFAULT 'demo_unpaid' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_orders_owner_request` ON `orders` (`owner_id`,`request_key`);--> statement-breakpoint
CREATE INDEX `idx_orders_owner_created` ON `orders` (`owner_id`,`created_at`);