import { processAllRules, groupDealsByUser } from "./dealsService";
import { sendNotifications } from "./notificationService";
import { processPushAlerts } from "./pushNotificationService";
import * as db from "./db";

/**
 * Main scheduled job that runs daily to find deals and send notifications
 */
export async function runDailyDealsJob(): Promise<{
  success: boolean;
  rulesProcessed: number;
  dealsFound: number;
  notificationsSent: number;
  error?: string;
}> {
  const startTime = Date.now();
  let jobLogId: number | undefined;

  try {
    // Create job log entry
    const jobLog = await db.createJobLog({
      jobType: "daily_deals_search",
      status: "running",
      rulesProcessed: 0,
      dealsFound: 0,
      notificationsSent: 0,
      errorMessage: null,
      executionTime: null,
      startedAt: new Date(),
      completedAt: null,
    });
    jobLogId = jobLog.id;

    console.log(`[Job ${jobLogId}] Starting daily deals search...`);

    // Process all active rules and find deals
    const result = await processAllRules();
    console.log(
      `[Job ${jobLogId}] Processed ${result.rulesProcessed} rules, found ${result.dealsFound} deals`
    );

    // Process push alerts for new deals
    const pushResult = await processPushAlerts(result.deals);
    console.log(
      `[Job ${jobLogId}] Processed push alerts: ${pushResult.alertsTriggered} triggered, ${pushResult.notificationsSent} sent`
    );

    // Group deals by user and send notifications
    const dealsByUser = groupDealsByUser(result.deals);
    let notificationsSent = 0;

    for (const [userId, userDeals] of Array.from(dealsByUser.entries())) {
      // Get all rules for this user to send notifications
      const userRules = await db.getMonitoringRulesByUserId(userId);

      // Group deals by rule
      const dealsByRule = new Map<number, typeof userDeals>();
      for (const deal of userDeals) {
        const ruleDeals = dealsByRule.get(deal.ruleId) || [];
        ruleDeals.push(deal);
        dealsByRule.set(deal.ruleId, ruleDeals);
      }

      // Send notifications for each rule
      for (const [ruleId, ruleDeals] of Array.from(dealsByRule.entries())) {
        const rule = userRules.find((r) => r.id === ruleId);
        if (rule) {
          const { emailSent, webhookSent } = await sendNotifications(rule, ruleDeals);
          if (emailSent || webhookSent) {
            notificationsSent++;
            console.log(
              `[Job ${jobLogId}] Sent notification for rule ${ruleId} (${ruleDeals.length} deals)`
            );
          }
        }
      }
    }

    const executionTime = Date.now() - startTime;

    // Update job log with success
    await db.updateJobLog(jobLogId, {
      status: "success",
      rulesProcessed: result.rulesProcessed,
      dealsFound: result.dealsFound,
      notificationsSent,
      executionTime,
      completedAt: new Date(),
    });

    console.log(
      `[Job ${jobLogId}] Completed successfully in ${executionTime}ms. Sent ${notificationsSent} notifications.`
    );

    return {
      success: true,
      rulesProcessed: result.rulesProcessed,
      dealsFound: result.dealsFound,
      notificationsSent,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    console.error(`[Job ${jobLogId}] Failed:`, error);

    if (jobLogId) {
      await db.updateJobLog(jobLogId, {
        status: "error",
        errorMessage,
        executionTime,
        completedAt: new Date(),
      });
    }

    return {
      success: false,
      rulesProcessed: 0,
      dealsFound: 0,
      notificationsSent: 0,
      error: errorMessage,
    };
  }
}

/**
 * Manual trigger for testing purposes
 */
export async function triggerManualJob(): Promise<void> {
  console.log("Manually triggering daily deals job...");
  const result = await runDailyDealsJob();
  console.log("Manual job result:", result);
}
