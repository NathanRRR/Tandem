CREATE TABLE `app_settings` (
	`id` int NOT NULL,
	`split_mode` enum('equal_rav','proportional_income') NOT NULL DEFAULT 'equal_rav',
	CONSTRAINT `app_settings_id` PRIMARY KEY(`id`)
);
