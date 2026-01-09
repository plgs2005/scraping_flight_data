import { searchFlights, calculateDiscount } from "./amadeus";
import * as db from "./db";
import { MonitoringRule } from "../drizzle/schema";
import { format } from "date-fns";

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
 * Search for flight deals based on a monitoring rule
 */
export async function searchFlightDeals(rule: MonitoringRule): Promise<FoundDeal[]> {
  if (!rule.origin || !rule.destination || !rule.departureDate) {
    console.log(`Rule ${rule.id} missing required fields for flight search`);
    return [];
  }

  try {
    const departureDate = format(new Date(rule.departureDate), "yyyy-MM-dd");
    const returnDate = rule.returnDate
      ? format(new Date(rule.returnDate), "yyyy-MM-dd")
      : undefined;

    const offers = await searchFlights({
      origin: rule.origin,
      destination: rule.destination,
      departureDate,
      returnDate,
      max: 20,
    });

    const deals: FoundDeal[] = [];

    for (const offer of offers) {
      const currentPrice = parseFloat(offer.price.total);
      const basePrice = offer.price.base ? parseFloat(offer.price.base) : currentPrice * 1.5;
      const discount = calculateDiscount(currentPrice, basePrice);

      // Only include deals that meet minimum discount requirement
      if (discount >= rule.minDiscount) {
        const firstSegment = offer.itineraries[0]?.segments[0];
        const lastSegment = offer.itineraries[0]?.segments[offer.itineraries[0].segments.length - 1];

        if (firstSegment && lastSegment) {
          deals.push({
            ruleId: rule.id,
            userId: rule.userId,
            type: "flight",
            title: `${firstSegment.departure.iataCode} → ${lastSegment.arrival.iataCode}`,
            origin: firstSegment.departure.iataCode,
            destination: lastSegment.arrival.iataCode,
            departureDate: new Date(firstSegment.departure.at),
            returnDate: offer.itineraries[1]?.segments[0]
              ? new Date(offer.itineraries[1].segments[0].departure.at)
              : undefined,
            originalPrice: basePrice,
            currentPrice,
            discountPercentage: discount,
            currency: offer.price.currency,
            offerUrl: `https://www.amadeus.com/booking?offer=${offer.id}`,
            provider: "Amadeus",
            details: offer,
          });
        }
      }
    }

    return deals;
  } catch (error) {
    console.error(`Error searching flights for rule ${rule.id}:`, error);
    return [];
  }
}

/**
 * Search for cruise deals (placeholder - no API available yet)
 */
export async function searchCruiseDeals(rule: MonitoringRule): Promise<FoundDeal[]> {
  // TODO: Integrate with cruise API when available
  console.log(`Cruise search not yet implemented for rule ${rule.id}`);
  return [];
}

/**
 * Process all active monitoring rules and find deals
 */
export async function processAllRules(): Promise<{
  rulesProcessed: number;
  dealsFound: number;
  deals: FoundDeal[];
}> {
  const activeRules = await db.getActiveMonitoringRules();
  let totalDeals = 0;
  const allDeals: FoundDeal[] = [];

  for (const rule of activeRules) {
    try {
      let deals: FoundDeal[] = [];

      if (rule.type === "flight") {
        deals = await searchFlightDeals(rule);
      } else if (rule.type === "cruise") {
        deals = await searchCruiseDeals(rule);
      }

      // Save deals to database
      for (const deal of deals) {
        try {
          await db.createDeal({
            ruleId: deal.ruleId,
            userId: deal.userId,
            type: deal.type,
            title: deal.title,
            origin: deal.origin,
            destination: deal.destination,
            departureDate: deal.departureDate,
            returnDate: deal.returnDate ?? null,
            originalPrice: deal.originalPrice.toString(),
            currentPrice: deal.currentPrice.toString(),
            discountPercentage: deal.discountPercentage,
            currency: deal.currency,
            offerUrl: deal.offerUrl,
            provider: deal.provider,
            details: deal.details,
            isValid: true,
            validatedAt: new Date(),
            notifiedAt: null,
          });
          allDeals.push(deal);
          totalDeals++;
        } catch (error) {
          console.error(`Error saving deal:`, error);
        }
      }
    } catch (error) {
      console.error(`Error processing rule ${rule.id}:`, error);
    }
  }

  return {
    rulesProcessed: activeRules.length,
    dealsFound: totalDeals,
    deals: allDeals,
  };
}

/**
 * Group deals by user for notification
 */
export function groupDealsByUser(deals: FoundDeal[]): Map<number, FoundDeal[]> {
  const grouped = new Map<number, FoundDeal[]>();

  for (const deal of deals) {
    const userDeals = grouped.get(deal.userId) || [];
    userDeals.push(deal);
    grouped.set(deal.userId, userDeals);
  }

  return grouped;
}
