import axios from "axios";

interface AmadeusAuthResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface FlightOffer {
  id: string;
  source: string;
  price: {
    total: string;
    currency: string;
    base?: string;
  };
  itineraries: Array<{
    segments: Array<{
      departure: {
        iataCode: string;
        at: string;
      };
      arrival: {
        iataCode: string;
        at: string;
      };
      carrierCode: string;
      number: string;
    }>;
  }>;
}

interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults?: number;
  max?: number;
}

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Get Amadeus API access token
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const apiKey = process.env.AMADEUS_API_KEY;
  const apiSecret = process.env.AMADEUS_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("Amadeus API credentials not configured");
  }

  try {
    const response = await axios.post<AmadeusAuthResponse>(
      "https://test.api.amadeus.com/v1/security/oauth2/token",
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: apiKey,
        client_secret: apiSecret,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    cachedToken = response.data.access_token;
    // Set expiry to 5 minutes before actual expiry
    tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;

    return cachedToken;
  } catch (error) {
    console.error("Failed to get Amadeus access token:", error);
    throw new Error("Failed to authenticate with Amadeus API");
  }
}

/**
 * Search for flight offers
 */
export async function searchFlights(params: FlightSearchParams): Promise<FlightOffer[]> {
  const token = await getAccessToken();

  try {
    const response = await axios.get<{ data: FlightOffer[] }>(
      "https://test.api.amadeus.com/v2/shopping/flight-offers",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          originLocationCode: params.origin,
          destinationLocationCode: params.destination,
          departureDate: params.departureDate,
          returnDate: params.returnDate,
          adults: params.adults || 1,
          max: params.max || 10,
        },
      }
    );

    return response.data.data || [];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Amadeus API error:", error.response?.data);
      throw new Error(
        error.response?.data?.errors?.[0]?.detail || "Failed to search flights"
      );
    }
    throw error;
  }
}

/**
 * Validate API credentials by making a test request
 */
export async function validateCredentials(): Promise<boolean> {
  try {
    await getAccessToken();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Calculate discount percentage based on historical prices
 * Note: Amadeus API doesn't provide historical prices directly
 * This is a simplified implementation
 */
export function calculateDiscount(currentPrice: number, basePrice?: number): number {
  if (!basePrice || basePrice <= currentPrice) {
    return 0;
  }
  return Math.round(((basePrice - currentPrice) / basePrice) * 100);
}
