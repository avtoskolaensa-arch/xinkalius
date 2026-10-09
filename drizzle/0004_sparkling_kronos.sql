CREATE TABLE `cash_movements` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`shift_id` text NOT NULL,
	`request_key` text NOT NULL,
	`request_hash` text NOT NULL,
	`amount` integer NOT NULL,
	`kind` text NOT NULL,
	`note` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_cash_move_request` ON `cash_movements` (`owner_id`,`request_key`);--> statement-breakpoint
CREATE INDEX `idx_cash_move_shift` ON `cash_movements` (`shift_id`);--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`request_key` text NOT NULL,
	`request_hash` text NOT NULL,
	`amount` integer NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`paid_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`payment_source` text NOT NULL,
	`shift_id` text,
	`voided_at` integer,
	`void_reason` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_expense_request` ON `expenses` (`owner_id`,`request_key`);--> statement-breakpoint
CREATE INDEX `idx_expense_owner_paid` ON `expenses` (`owner_id`,`paid_at`);--> statement-breakpoint
CREATE TABLE `cash_shifts` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`active_owner` text,
	`request_key` text NOT NULL,
	`request_hash` text NOT NULL,
	`opened_at` integer NOT NULL,
	`closed_at` integer,
	`opening_cash` integer NOT NULL,
	`expected_cash` integer,
	`counted_cash` integer,
	`difference` integer,
	`close_key` text,
	`close_hash` text,
	`note` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_shift_active` ON `cash_shifts` (`active_owner`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_shift_request` ON `cash_shifts` (`owner_id`,`request_key`);--> statement-breakpoint
CREATE INDEX `idx_shift_owner_opened` ON `cash_shifts` (`owner_id`,`opened_at`);--> statement-breakpoint
ALTER TABLE `orders` ADD `delivery_lat` real;--> statement-breakpoint
ALTER TABLE `orders` ADD `delivery_lng` real;--> statement-breakpoint
ALTER TABLE `orders` ADD `zone_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `zone_name_en` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `zone_name_ru` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `travel_minutes` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `shift_id` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `cash_destination` text DEFAULT 'legacy' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `translations` text DEFAULT '{}' NOT NULL;