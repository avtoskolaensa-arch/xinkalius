CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`ingredients` text NOT NULL,
	`allergens` text NOT NULL,
	`category` text NOT NULL,
	`price` integer NOT NULL,
	`cost` integer NOT NULL,
	`image` text NOT NULL,
	`available` integer DEFAULT 1 NOT NULL,
	`min_quantity` integer DEFAULT 1 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_products_owner` ON `products` (`owner_id`);--> statement-breakpoint
CREATE TABLE `store_settings` (
	`owner_id` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `payment_method` text DEFAULT 'demo' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `source` text DEFAULT 'web' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `prep_minutes` integer DEFAULT 25 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `cash_received` integer;