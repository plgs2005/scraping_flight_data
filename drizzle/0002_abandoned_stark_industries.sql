CREATE TABLE `push_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('flight','cruise','both') NOT NULL DEFAULT 'both',
	`origin` varchar(100),
	`destination` varchar(100),
	`minDiscount` int NOT NULL DEFAULT 50,
	`maxPrice` decimal(10,2),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `push_alerts_id` PRIMARY KEY(`id`)
);
