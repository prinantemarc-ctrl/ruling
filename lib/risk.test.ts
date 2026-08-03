import { describe, expect, it } from "vitest";
import {
  computePlatformReserve,
  getMaxTradeSize,
  validateMarketCreation,
} from "./risk";

describe("risk", () => {
  it("allows creation when reserve is sufficient", () => {
    const result = validateMarketCreation(20, 100, 40);
    expect(result.valid).toBe(true);
  });

  it("rejects creation when commitments exceed reserve", () => {
    const result = validateMarketCreation(30, 100, 80);
    expect(result.valid).toBe(false);
    expect(result.reason).toBeTruthy();
  });

  it("getMaxTradeSize scales with b", () => {
    expect(getMaxTradeSize(50)).toBe(50);
    expect(getMaxTradeSize(100)).toBe(100);
  });

  it("computePlatformReserve subtracts active commitments", () => {
    expect(computePlatformReserve(100, 40)).toBe(60);
  });

  it("zero reserve rejects any positive maxLoss", () => {
    const result = validateMarketCreation(1, 0, 0);
    expect(result.valid).toBe(false);
  });
});
