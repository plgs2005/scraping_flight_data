import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  monitoringRules, 
  InsertMonitoringRule, 
  MonitoringRule,
  dealsHistory,
  InsertDeal,
  Deal,
  jobLogs,
  InsertJobLog,
  pushAlerts,
  InsertPushAlert,
  PushAlert
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============= User Management =============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============= Monitoring Rules =============

export async function createMonitoringRule(rule: InsertMonitoringRule): Promise<MonitoringRule> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(monitoringRules).values(rule);
  const insertedId = Number(result[0].insertId);
  
  const created = await db.select().from(monitoringRules).where(eq(monitoringRules.id, insertedId)).limit(1);
  return created[0]!;
}

export async function getMonitoringRulesByUserId(userId: number): Promise<MonitoringRule[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(monitoringRules)
    .where(eq(monitoringRules.userId, userId))
    .orderBy(desc(monitoringRules.createdAt));
}

export async function getMonitoringRuleById(id: number, userId: number): Promise<MonitoringRule | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(monitoringRules)
    .where(and(eq(monitoringRules.id, id), eq(monitoringRules.userId, userId)))
    .limit(1);
  
  return result[0];
}

export async function updateMonitoringRule(id: number, userId: number, updates: Partial<InsertMonitoringRule>): Promise<MonitoringRule | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(monitoringRules)
    .set(updates)
    .where(and(eq(monitoringRules.id, id), eq(monitoringRules.userId, userId)));

  return await getMonitoringRuleById(id, userId);
}

export async function deleteMonitoringRule(id: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.delete(monitoringRules)
    .where(and(eq(monitoringRules.id, id), eq(monitoringRules.userId, userId)));

  return result[0].affectedRows > 0;
}

export async function getActiveMonitoringRules(): Promise<MonitoringRule[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(monitoringRules)
    .where(eq(monitoringRules.isActive, true));
}

// ============= Deals History =============

export async function createDeal(deal: InsertDeal): Promise<Deal> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(dealsHistory).values(deal);
  const insertedId = Number(result[0].insertId);
  
  const created = await db.select().from(dealsHistory).where(eq(dealsHistory.id, insertedId)).limit(1);
  return created[0]!;
}

export async function getDealsByUserId(userId: number, limit: number = 50): Promise<Deal[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(dealsHistory)
    .where(eq(dealsHistory.userId, userId))
    .orderBy(desc(dealsHistory.createdAt))
    .limit(limit);
}

export async function getDealsByRuleId(ruleId: number): Promise<Deal[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(dealsHistory)
    .where(eq(dealsHistory.ruleId, ruleId))
    .orderBy(desc(dealsHistory.createdAt));
}

// ============= Job Logs =============

export async function createJobLog(log: InsertJobLog): Promise<JobLog> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(jobLogs).values(log);
  const insertedId = Number(result[0].insertId);
  
  const created = await db.select().from(jobLogs).where(eq(jobLogs.id, insertedId)).limit(1);
  return created[0]!;
}

export async function updateJobLog(id: number, updates: Partial<InsertJobLog>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(jobLogs)
    .set(updates)
    .where(eq(jobLogs.id, id));
}

export async function getRecentJobLogs(limit: number = 20): Promise<JobLog[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(jobLogs)
    .orderBy(desc(jobLogs.startedAt))
    .limit(limit);
}

export type JobLog = typeof jobLogs.$inferSelect;

// ============= Push Alerts Management =============

export async function createPushAlert(alert: InsertPushAlert): Promise<PushAlert> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [inserted] = await db.insert(pushAlerts).values(alert);
  const [created] = await db
    .select()
    .from(pushAlerts)
    .where(eq(pushAlerts.id, Number(inserted.insertId)))
    .limit(1);

  if (!created) throw new Error("Failed to create push alert");
  return created;
}

export async function getUserPushAlerts(userId: number): Promise<PushAlert[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(pushAlerts)
    .where(eq(pushAlerts.userId, userId))
    .orderBy(desc(pushAlerts.createdAt));
}

export async function getActivePushAlerts(): Promise<PushAlert[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(pushAlerts)
    .where(eq(pushAlerts.isActive, true))
    .orderBy(desc(pushAlerts.createdAt));
}

export async function getPushAlertById(id: number): Promise<PushAlert | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const [alert] = await db
    .select()
    .from(pushAlerts)
    .where(eq(pushAlerts.id, id))
    .limit(1);

  return alert;
}

export async function updatePushAlert(
  id: number,
  updates: Partial<InsertPushAlert>
): Promise<PushAlert | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(pushAlerts).set(updates).where(eq(pushAlerts.id, id));

  return await getPushAlertById(id);
}

export async function deletePushAlert(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(pushAlerts).where(eq(pushAlerts.id, id));
}

export async function togglePushAlert(id: number, isActive: boolean): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(pushAlerts).set({ isActive }).where(eq(pushAlerts.id, id));
}
