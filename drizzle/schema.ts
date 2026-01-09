import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Monitoring rules table - stores user-defined search criteria
 */
export const monitoringRules = mysqlTable("monitoring_rules", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["flight", "cruise"]).notNull(),
  origin: varchar("origin", { length: 100 }),
  destination: varchar("destination", { length: 100 }),
  departureDate: timestamp("departureDate"),
  returnDate: timestamp("returnDate"),
  minDiscount: int("minDiscount").notNull().default(50), // minimum discount percentage
  notificationType: mysqlEnum("notificationType", ["email", "webhook", "both"]).notNull().default("email"),
  notificationEmail: varchar("notificationEmail", { length: 320 }),
  notificationWebhook: text("notificationWebhook"),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MonitoringRule = typeof monitoringRules.$inferSelect;
export type InsertMonitoringRule = typeof monitoringRules.$inferInsert;

/**
 * Deals history table - stores found deals matching user rules
 */
export const dealsHistory = mysqlTable("deals_history", {
  id: int("id").autoincrement().primaryKey(),
  ruleId: int("ruleId").notNull(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["flight", "cruise"]).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  origin: varchar("origin", { length: 100 }),
  destination: varchar("destination", { length: 100 }),
  departureDate: timestamp("departureDate"),
  returnDate: timestamp("returnDate"),
  originalPrice: decimal("originalPrice", { precision: 10, scale: 2 }).notNull(),
  currentPrice: decimal("currentPrice", { precision: 10, scale: 2 }).notNull(),
  discountPercentage: int("discountPercentage").notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("USD"),
  offerUrl: text("offerUrl").notNull(),
  provider: varchar("provider", { length: 100 }),
  details: json("details"), // additional metadata from API
  isValid: boolean("isValid").notNull().default(true),
  validatedAt: timestamp("validatedAt").defaultNow().notNull(),
  notifiedAt: timestamp("notifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Deal = typeof dealsHistory.$inferSelect;
export type InsertDeal = typeof dealsHistory.$inferInsert;

/**
 * Job execution logs table - tracks scheduled job runs
 */
export const jobLogs = mysqlTable("job_logs", {
  id: int("id").autoincrement().primaryKey(),
  jobType: varchar("jobType", { length: 100 }).notNull(),
  status: mysqlEnum("status", ["success", "error", "running"]).notNull(),
  rulesProcessed: int("rulesProcessed").notNull().default(0),
  dealsFound: int("dealsFound").notNull().default(0),
  notificationsSent: int("notificationsSent").notNull().default(0),
  errorMessage: text("errorMessage"),
  executionTime: int("executionTime"), // in milliseconds
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type JobLog = typeof jobLogs.$inferSelect;
export type InsertJobLog = typeof jobLogs.$inferInsert;

/**
 * Push alerts table - stores user-defined push notification preferences
 */
export const pushAlerts = mysqlTable("push_alerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["flight", "cruise", "both"]).notNull().default("both"),
  origin: varchar("origin", { length: 100 }),
  destination: varchar("destination", { length: 100 }),
  minDiscount: int("minDiscount").notNull().default(50),
  maxPrice: decimal("maxPrice", { precision: 10, scale: 2 }),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PushAlert = typeof pushAlerts.$inferSelect;
export type InsertPushAlert = typeof pushAlerts.$inferInsert;
