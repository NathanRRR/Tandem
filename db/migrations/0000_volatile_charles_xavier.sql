CREATE TABLE `categories` (
	`id` varchar(64) NOT NULL,
	`label` varchar(255) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` varchar(36) NOT NULL,
	`template_id` varchar(36),
	`label` varchar(255) NOT NULL,
	`category_id` varchar(64) NOT NULL,
	`amount_cents` int NOT NULL,
	`payer_id` varchar(36) NOT NULL,
	`date` date NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`),
	CONSTRAINT `expenses_amount_nonnegative` CHECK(`expenses`.`amount_cents` >= 0)
);
--> statement-breakpoint
CREATE TABLE `incomes` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`amount_cents` int NOT NULL,
	`effective_month` date NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `incomes_id` PRIMARY KEY(`id`),
	CONSTRAINT `incomes_user_effective_month_idx` UNIQUE(`user_id`,`effective_month`),
	CONSTRAINT `incomes_amount_nonnegative` CHECK(`incomes`.`amount_cents` >= 0)
);
--> statement-breakpoint
CREATE TABLE `monthly_settlements` (
	`month` date NOT NULL,
	`settled` boolean NOT NULL DEFAULT false,
	`settled_at` timestamp,
	CONSTRAINT `monthly_settlements_month` PRIMARY KEY(`month`)
);
--> statement-breakpoint
CREATE TABLE `recurring_templates` (
	`id` varchar(36) NOT NULL,
	`label` varchar(255) NOT NULL,
	`category_id` varchar(64) NOT NULL,
	`amount_cents` int NOT NULL,
	`default_payer_id` varchar(36) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recurring_templates_id` PRIMARY KEY(`id`),
	CONSTRAINT `recurring_templates_amount_nonnegative` CHECK(`recurring_templates`.`amount_cents` >= 0)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`username` varchar(255) NOT NULL,
	`password_hash` text NOT NULL,
	`name` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_template_id_recurring_templates_id_fk` FOREIGN KEY (`template_id`) REFERENCES `recurring_templates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_payer_id_users_id_fk` FOREIGN KEY (`payer_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `incomes` ADD CONSTRAINT `incomes_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `recurring_templates` ADD CONSTRAINT `recurring_templates_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `recurring_templates` ADD CONSTRAINT `recurring_templates_default_payer_id_users_id_fk` FOREIGN KEY (`default_payer_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `expenses_date_idx` ON `expenses` (`date`);