import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

// Validation schemas
const createRuleSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(["flight", "cruise"]),
  origin: z.string().optional(),
  destination: z.string().optional(),
  departureDate: z.date().optional(),
  returnDate: z.date().optional(),
  minDiscount: z.number().min(0).max(100).default(50),
  notificationType: z.enum(["email", "webhook", "both"]).default("email"),
  notificationEmail: z.string().email().optional(),
  notificationWebhook: z.string().url().optional(),
  isActive: z.boolean().default(true),
});

const updateRuleSchema = createRuleSchema.partial();

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Monitoring Rules CRUD
  rules: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getMonitoringRulesByUserId(ctx.user.id);
    }),

    create: protectedProcedure
      .input(createRuleSchema)
      .mutation(async ({ ctx, input }) => {
        const rule = await db.createMonitoringRule({
          ...input,
          userId: ctx.user.id,
          departureDate: input.departureDate ?? null,
          returnDate: input.returnDate ?? null,
          origin: input.origin ?? null,
          destination: input.destination ?? null,
          notificationEmail: input.notificationEmail ?? null,
          notificationWebhook: input.notificationWebhook ?? null,
        });
        return rule;
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const rule = await db.getMonitoringRuleById(input.id, ctx.user.id);
        if (!rule) {
          throw new Error("Regra não encontrada");
        }
        return rule;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: updateRuleSchema,
      }))
      .mutation(async ({ ctx, input }) => {
        const updated = await db.updateMonitoringRule(input.id, ctx.user.id, input.data);
        if (!updated) {
          throw new Error("Regra não encontrada ou não pôde ser atualizada");
        }
        return updated;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const deleted = await db.deleteMonitoringRule(input.id, ctx.user.id);
        if (!deleted) {
          throw new Error("Regra não encontrada");
        }
        return { success: true };
      }),

    toggleActive: protectedProcedure
      .input(z.object({ id: z.number(), isActive: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const updated = await db.updateMonitoringRule(input.id, ctx.user.id, {
          isActive: input.isActive,
        });
        if (!updated) {
          throw new Error("Regra não encontrada");
        }
        return updated;
      }),
  }),

  // Deals History
  deals: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return await db.getDealsByUserId(ctx.user.id, input?.limit);
      }),

    byRule: protectedProcedure
      .input(z.object({ ruleId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getDealsByRuleId(input.ruleId);
      }),
  }),

  // Push Alerts
  alerts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserPushAlerts(ctx.user.id);
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1, "Nome é obrigatório"),
          type: z.enum(["flight", "cruise", "both"]).default("both"),
          origin: z.string().optional(),
          destination: z.string().optional(),
          minDiscount: z.number().min(0).max(100).default(50),
          maxPrice: z.number().optional(),
          isActive: z.boolean().default(true),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const alert = await db.createPushAlert({
          ...input,
          userId: ctx.user.id,
          maxPrice: input.maxPrice?.toString() ?? null,
        });
        return alert;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          type: z.enum(["flight", "cruise", "both"]).optional(),
          origin: z.string().optional(),
          destination: z.string().optional(),
          minDiscount: z.number().min(0).max(100).optional(),
          maxPrice: z.number().optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        const alert = await db.getPushAlertById(id);
        if (!alert || alert.userId !== ctx.user.id) {
          throw new Error("Alerta não encontrado");
        }
        const updated = await db.updatePushAlert(id, {
          ...updates,
          maxPrice: updates.maxPrice?.toString() ?? undefined,
        });
        return updated;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const alert = await db.getPushAlertById(input.id);
        if (!alert || alert.userId !== ctx.user.id) {
          throw new Error("Alerta não encontrado");
        }
        await db.deletePushAlert(input.id);
        return { success: true };
      }),

    toggle: protectedProcedure
      .input(z.object({ id: z.number(), isActive: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const alert = await db.getPushAlertById(input.id);
        if (!alert || alert.userId !== ctx.user.id) {
          throw new Error("Alerta não encontrado");
        }
        await db.togglePushAlert(input.id, input.isActive);
        return { success: true };
      }),
  }),

  // Job Logs
  jobs: router({
    logs: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return await db.getRecentJobLogs(input?.limit);
      }),
    
    runManual: protectedProcedure
      .mutation(async ({ ctx }) => {
        const { runDailyDealsJob } = await import("./scheduledJob");
        const result = await runDailyDealsJob();
        return result;
      }),
  }),
});

export type AppRouter = typeof appRouter;
