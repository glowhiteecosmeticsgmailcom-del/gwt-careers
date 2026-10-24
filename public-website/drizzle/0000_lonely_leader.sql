CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`status` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL
);
