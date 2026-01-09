CREATE TABLE `deals_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ruleId` int NOT NULL,
	`userId` int NOT NULL,
	`type` enum('flight','cruise') NOT NULL,
	`title` varchar(500) NOT NULL,
	`origin` varchar(100),
	`destination` varchar(100),
	`departureDate` timestamp,
	`returnDate` timestamp,
	`originalPrice` decimal(10,2) NOT NULL,
	`currentPrice` decimal(10,2) NOT NULL,
	`discountPercentage` int NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'USD',
	`offerUrl` text NOT NULL,
	`provider` varchar(100),
	`details` json,
	`isValid` boolean NOT NULL DEFAULT true,
	`validatedAt` timestamp NOT NULL DEFAULT (now()),
	`notifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deals_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `job_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobType` varchar(100) NOT NULL,
	`status` enum('success','error','running') NOT NULL,
	`rulesProcessed` int NOT NULL DEFAULT 0,
	`dealsFound` int NOT NULL DEFAULT 0,
	`notificationsSent` int NOT NULL DEFAULT 0,
	`errorMessage` text,
	`executionTime` int,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `job_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monitoring_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('flight','cruise') NOT NULL,
	`origin` varchar(100),
	`destination` varchar(100),
	`departureDate` timestamp,
	`returnDate` timestamp,
	`minDiscount` int NOT NULL DEFAULT 50,
	`notificationType` enum('email','webhook','both') NOT NULL DEFAULT 'email',
	`notificationEmail` varchar(320),
	`notificationWebhook` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monitoring_rules_id` PRIMARY KEY(`id`)
);
