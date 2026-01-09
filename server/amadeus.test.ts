import { describe, expect, it } from "vitest";
import { validateCredentials } from "./amadeus";

describe("Amadeus API Integration", () => {
  it("should validate API credentials successfully", async () => {
    const isValid = await validateCredentials();
    expect(isValid).toBe(true);
  }, 10000); // 10 second timeout for API call
});
