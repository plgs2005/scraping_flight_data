import axios from "axios";
import { MonitoringRule } from "../drizzle/schema";

interface Deal {
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
}

/**
 * Send email notification with deals
 */
export async function sendEmailNotification(
  email: string,
  deals: Deal[],
  rule: MonitoringRule
): Promise<boolean> {
  if (!email) {
    console.error("No email provided for notification");
    return false;
  }

  try {
    const subject = `🎉 ${deals.length} Nova(s) Oferta(s) Encontrada(s): ${rule.name}`;
    const htmlContent = generateEmailHTML(deals, rule);

    // Using a simple email sending approach
    // In production, you would use a service like SendGrid, AWS SES, or similar
    console.log(`Sending email to ${email} with ${deals.length} deals`);
    console.log(`Subject: ${subject}`);
    console.log(`HTML Content length: ${htmlContent.length} chars`);

    // TODO: Integrate with actual email service
    // For now, we'll just log the email content
    // In production, replace this with actual email sending logic:
    // await emailService.send({ to: email, subject, html: htmlContent });

    return true;
  } catch (error) {
    console.error("Error sending email notification:", error);
    return false;
  }
}

/**
 * Send webhook notification with deals
 */
export async function sendWebhookNotification(
  webhookUrl: string,
  deals: Deal[],
  rule: MonitoringRule
): Promise<boolean> {
  if (!webhookUrl) {
    console.error("No webhook URL provided for notification");
    return false;
  }

  try {
    const payload = {
      rule: {
        id: rule.id,
        name: rule.name,
        type: rule.type,
      },
      deals: deals.map((deal) => ({
        title: deal.title,
        origin: deal.origin,
        destination: deal.destination,
        departureDate: deal.departureDate.toISOString(),
        returnDate: deal.returnDate?.toISOString(),
        originalPrice: deal.originalPrice,
        currentPrice: deal.currentPrice,
        discountPercentage: deal.discountPercentage,
        currency: deal.currency,
        offerUrl: deal.offerUrl,
        provider: deal.provider,
      })),
      timestamp: new Date().toISOString(),
    };

    await axios.post(webhookUrl, payload, {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "FlightDealsTracker/1.0",
      },
      timeout: 10000,
    });

    console.log(`Webhook sent successfully to ${webhookUrl}`);
    return true;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Webhook error: ${error.message}`, error.response?.data);
    } else {
      console.error("Error sending webhook notification:", error);
    }
    return false;
  }
}

/**
 * Send notifications based on rule configuration
 */
export async function sendNotifications(
  rule: MonitoringRule,
  deals: Deal[]
): Promise<{ emailSent: boolean; webhookSent: boolean }> {
  let emailSent = false;
  let webhookSent = false;

  if (deals.length === 0) {
    return { emailSent, webhookSent };
  }

  if (rule.notificationType === "email" || rule.notificationType === "both") {
    if (rule.notificationEmail) {
      emailSent = await sendEmailNotification(rule.notificationEmail, deals, rule);
    }
  }

  if (rule.notificationType === "webhook" || rule.notificationType === "both") {
    if (rule.notificationWebhook) {
      webhookSent = await sendWebhookNotification(rule.notificationWebhook, deals, rule);
    }
  }

  return { emailSent, webhookSent };
}

/**
 * Generate HTML email content
 */
function generateEmailHTML(deals: Deal[], rule: MonitoringRule): string {
  const dealsHTML = deals
    .map(
      (deal) => `
    <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; margin-bottom: 16px; background: white;">
      <h3 style="margin: 0 0 8px 0; color: #1a1a1a;">${deal.title}</h3>
      <p style="margin: 4px 0; color: #666;">
        <strong>Rota:</strong> ${deal.origin} → ${deal.destination}
      </p>
      <p style="margin: 4px 0; color: #666;">
        <strong>Data de Ida:</strong> ${deal.departureDate.toLocaleDateString("pt-BR")}
        ${deal.returnDate ? `<br><strong>Data de Volta:</strong> ${deal.returnDate.toLocaleDateString("pt-BR")}` : ""}
      </p>
      <div style="margin: 12px 0;">
        <span style="background: #22c55e; color: white; padding: 4px 12px; border-radius: 4px; font-weight: bold; font-size: 18px;">
          ${deal.discountPercentage}% OFF
        </span>
      </div>
      <p style="margin: 8px 0;">
        <span style="text-decoration: line-through; color: #999;">
          De: ${deal.currency} ${deal.originalPrice.toFixed(2)}
        </span>
        <br>
        <span style="font-size: 24px; font-weight: bold; color: #22c55e;">
          ${deal.currency} ${deal.currentPrice.toFixed(2)}
        </span>
      </p>
      <p style="margin: 8px 0; font-size: 12px; color: #999;">
        Fornecedor: ${deal.provider}
      </p>
      <a href="${deal.offerUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin-top: 8px;">
        Ver Oferta →
      </a>
    </div>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Novas Ofertas Encontradas</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px;">✈️ Novas Ofertas Encontradas!</h1>
      <p style="margin: 8px 0 0 0; opacity: 0.9;">Regra: ${rule.name}</p>
    </div>
    
    <div style="padding: 24px;">
      <p style="margin: 0 0 16px 0; color: #666;">
        Encontramos <strong>${deals.length}</strong> nova(s) oferta(s) que atendem seus critérios:
      </p>
      
      ${dealsHTML}
      
      <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e0e0e0; text-align: center; color: #999; font-size: 12px;">
        <p>Você está recebendo este email porque configurou alertas no Flight Deals Tracker.</p>
        <p>Para gerenciar suas regras, acesse o dashboard.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}
