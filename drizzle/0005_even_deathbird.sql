CREATE INDEX `idx_expense_owner_shift` ON `expenses` (`owner_id`,`shift_id`);--> statement-breakpoint
CREATE INDEX `idx_orders_owner_shift` ON `orders` (`owner_id`,`shift_id`);