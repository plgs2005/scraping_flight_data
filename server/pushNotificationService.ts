import * as db from "./db";
import type { Deal, PushAlert } from "../drizzle/schema";

interface FoundDeal {
  ruleId: number;
  userId: number;
  type: "flight" | "cruise";
  title: string;
  origin: string;
  destination: string;
  departureDate: Date;
  returnDate?: Date;
  originalPrice: number;
  currentPrice: number;
  discountPercentage: number;
  currency: string;
  offerUrl: string;
  provider: string;
  details: any;
}

/**
 * Check if a deal matches a push alert criteria
 */
function dealMatchesAlert(deal: FoundDeal, alert: PushAlert): boolean {
  // Check type
  if (alert.type !== "both") {
    if (deal.type !== alert.type) {
      return false;
    }
  }

  // Check origin (handle null values)
  if (alert.origin && deal.origin && deal.origin !== alert.origin) {
    return false;
  }

  // Check destination (handle null values)
  if (alert.destination && deal.destination && deal.destination !== alert.destination) {
    return false;
  }

  // Check minimum discount
  if (deal.discountPercentage < alert.minDiscount) {
    return false;
  }

  // Check maximum price
  if (alert.maxPrice && Number(deal.currentPrice) > Number(alert.maxPrice)) {
    return false;
  }

  return true;
}

/**
 * Process push alerts for new deals
 * This function should be called from the scheduled job
 */
export async function processPushAlerts(deals: FoundDeal[]): Promise<{
  alertsTriggered: number;
  notificationsSent: number;
}> {
  if (deals.length === 0) {
    return { alertsTriggered: 0, notificationsSent: 0 };
  }

  // Get all active push alerts
  const activeAlerts = await db.getActivePushAlerts();

  if (activeAlerts.length === 0) {
    console.log("[PushAlerts] No active alerts found");
    return { alertsTriggered: 0, notificationsSent: 0 };
  }

  console.log(`[PushAlerts] Checking ${deals.length} deals against ${activeAlerts.length} alerts`);

  // Group alerts by user
  const alertsByUser = new Map<number, PushAlert[]>();
  for (const alert of activeAlerts) {
    const userAlerts = alertsByUser.get(alert.userId) || [];
    userAlerts.push(alert);
    alertsByUser.set(alert.userId, userAlerts);
  }

  let alertsTriggered = 0;
  let notificationsSent = 0;

  // Check each deal against user alerts
  for (const deal of deals) {
    const userAlerts = alertsByUser.get(deal.userId) || [];

    for (const alert of userAlerts) {
      if (dealMatchesAlert(deal, alert)) {
        alertsTriggered++;
        console.log(
          `[PushAlerts] Alert "${alert.name}" triggered for deal: ${deal.title}`
        );

        // In a real implementation, you would:
        // 1. Store push subscriptions in the database
        // 2. Use Web Push API to send notifications
        // 3. Handle subscription management
        
        // For now, we'll just log the notification
        // The actual push notification will be sent by the browser
        // when the user has the page open
        notificationsSent++;
      }
    }
  }

  console.log(
    `[PushAlerts] ${alertsTriggered} alerts triggered, ${notificationsSent} notifications queued`
  );

  return { alertsTriggered, notificationsSent };
}

/**
 * Format a deal for push notification
 */
export function formatDealForNotification(deal: FoundDeal): {
  title: string;
  body: string;
  icon?: string;
  data: any;
} {
  const discountText = `${deal.discountPercentage}% OFF`;
  const priceText = `${deal.currency} ${Number(deal.currentPrice).toFixed(2)}`;
  const routeText = deal.origin && deal.destination 
    ? `${deal.origin} → ${deal.destination}` 
    : deal.title;

  return {
    title: `🎉 ${discountText} - ${routeText}`,
    body: `De ${deal.currency} ${Number(deal.originalPrice).toFixed(2)} por ${priceText}`,
    icon: "/favicon.ico",
    data: {
      url: deal.offerUrl,
    },
  };
}
