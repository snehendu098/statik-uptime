CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`pub_key` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_pub_key_unique` ON `users` (`pub_key`);--> statement-breakpoint
CREATE TABLE `validators` (
	`id` text PRIMARY KEY NOT NULL,
	`pub_key` text NOT NULL,
	`location` text NOT NULL,
	`pending_payouts` integer DEFAULT 0 NOT NULL,
	`ip` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `website_ticks` (
	`id` text PRIMARY KEY NOT NULL,
	`website_id` text NOT NULL,
	`validator_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`status` text NOT NULL,
	`latency` real NOT NULL
);
--> statement-breakpoint
CREATE TABLE `websites` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`user_id` text NOT NULL,
	`disabled` integer DEFAULT false NOT NULL,
	`check_intervals` integer NOT NULL
);
