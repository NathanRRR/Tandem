DROP TABLE `app_settings`;
--> statement-breakpoint
CREATE TABLE `split_mode_settings` (
	`id` varchar(36) NOT NULL,
	`split_mode` enum('equal_rav','proportional_income') NOT NULL,
	`effective_month` date NOT NULL,
	CONSTRAINT `split_mode_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `split_mode_settings_effective_month_unique` UNIQUE(`effective_month`)
);
