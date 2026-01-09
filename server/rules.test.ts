import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("Monitoring Rules CRUD", () => {
  let createdRuleId: number;

  it("should create a new monitoring rule", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const rule = await caller.rules.create({
      name: "Test Flight Rule",
      type: "flight",
      origin: "GRU",
      destination: "CDG",
      minDiscount: 60,
      notificationType: "email",
      notificationEmail: "test@example.com",
      isActive: true,
    });

    expect(rule).toBeDefined();
    expect(rule.name).toBe("Test Flight Rule");
    expect(rule.type).toBe("flight");
    expect(rule.minDiscount).toBe(60);
    expect(rule.userId).toBe(ctx.user!.id);

    createdRuleId = rule.id;
  });

  it("should list all rules for the user", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const rules = await caller.rules.list();

    expect(Array.isArray(rules)).toBe(true);
    expect(rules.length).toBeGreaterThan(0);
    expect(rules.some((r) => r.id === createdRuleId)).toBe(true);
  });

  it("should get a rule by ID", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const rule = await caller.rules.getById({ id: createdRuleId });

    expect(rule).toBeDefined();
    expect(rule.id).toBe(createdRuleId);
    expect(rule.name).toBe("Test Flight Rule");
  });

  it("should update a rule", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const updated = await caller.rules.update({
      id: createdRuleId,
      data: {
        name: "Updated Flight Rule",
        minDiscount: 70,
      },
    });

    expect(updated).toBeDefined();
    expect(updated.name).toBe("Updated Flight Rule");
    expect(updated.minDiscount).toBe(70);
  });

  it("should toggle rule active status", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const toggled = await caller.rules.toggleActive({
      id: createdRuleId,
      isActive: false,
    });

    expect(toggled).toBeDefined();
    expect(toggled.isActive).toBe(false);
  });

  it("should delete a rule", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.rules.delete({ id: createdRuleId });

    expect(result.success).toBe(true);

    // Verify deletion
    await expect(
      caller.rules.getById({ id: createdRuleId })
    ).rejects.toThrow("Regra não encontrada");
  });
});
