import { describe, expect, it } from "vitest";
import {
  getCostToBuy,
  getDisplayBuyPrice,
  getDisplayCostToBuy,
  getDisplayProceedsFromSell,
  getDisplaySellPrice,
  getMaxLoss,
  getPrice,
  getRequiredB,
} from "./lmsr";

const eps = 1e-9;

describe("lmsr", () => {
  it("getPrice YES + NO = 1", () => {
    const qYes = 12;
    const qNo = 8;
    const b = 50;
    expect(getPrice(qYes, qNo, b, "YES") + getPrice(qYes, qNo, b, "NO")).toBeCloseTo(
      1,
      10
    );
  });

  it("buying YES raises YES price", () => {
    const b = 100;
    const before = getPrice(0, 0, b, "YES");
    const cost = getCostToBuy(0, 0, b, "YES", 10);
    expect(cost).toBeGreaterThan(0);
    const after = getPrice(10, 0, b, "YES");
    expect(after).toBeGreaterThan(before);
  });

  it("getCostToBuy is always positive for a purchase", () => {
    expect(getCostToBuy(0, 0, 40, "NO", 3)).toBeGreaterThan(0);
  });

  it("getMaxLoss(getRequiredB(50), 2) ≈ 50", () => {
    const b = getRequiredB(50, 2);
    expect(getMaxLoss(b, 2)).toBeCloseTo(50, 10);
  });

  it("small b with large shares stays finite", () => {
    const cost = getCostToBuy(0, 0, 0.01, "YES", 1000);
    expect(Number.isFinite(cost)).toBe(true);
    expect(Number.isNaN(cost)).toBe(false);
    const p = getPrice(1000, 0, 0.01, "YES");
    expect(Number.isFinite(p)).toBe(true);
  });

  it("display buy > fair and display sell < fair when markup > 0", () => {
    const markup = 0.02;
    const fair = getPrice(5, 5, 80, "YES");
    expect(getDisplayBuyPrice(5, 5, 80, "YES", markup)).toBeGreaterThan(fair);
    expect(getDisplaySellPrice(5, 5, 80, "YES", markup)).toBeLessThan(fair);
  });

  it("immediate round-trip loses about markup × fair cost", () => {
    const b = 100;
    const markup = 0.02;
    const shares = 5;
    const fairCost = getCostToBuy(0, 0, b, "YES", shares);
    const paid = getDisplayCostToBuy(0, 0, b, "YES", shares, markup);
    const received = getDisplayProceedsFromSell(shares, 0, b, "YES", shares, markup);
    const loss = paid - received;
    expect(loss).toBeCloseTo(markup * fairCost, 8);
    expect(Math.abs(loss - markup * fairCost)).toBeLessThan(eps + 1e-8);
  });
});
