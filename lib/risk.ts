/** Max shares per trade as a multiple of LMSR b — protects real USDC from single-trade manipulation. */
export const MAX_TRADE_TO_B_RATIO = 1;

export type ValidationResult = { valid: boolean; reason?: string };

/**
 * Blocks creating a REAL market when cumulative LMSR max-loss would exceed
 * confirmed USDC balances held by the platform (real money, not play).
 */
export function validateMarketCreation(
  maxLossAllowed: number,
  platformReserve: number,
  activeMarketsMaxLossSum: number
): ValidationResult {
  if (!(maxLossAllowed > 0) || !Number.isFinite(maxLossAllowed)) {
    return { valid: false, reason: "maxLossAllowed must be a positive number" };
  }
  if (!Number.isFinite(platformReserve) || platformReserve < 0) {
    return { valid: false, reason: "platformReserve must be a non-negative number" };
  }
  if (!Number.isFinite(activeMarketsMaxLossSum) || activeMarketsMaxLossSum < 0) {
    return {
      valid: false,
      reason: "activeMarketsMaxLossSum must be a non-negative number",
    };
  }
  if (activeMarketsMaxLossSum + maxLossAllowed > platformReserve) {
    return {
      valid: false,
      reason:
        "Insufficient real USDC reserve: active commitments plus this market's max loss exceed confirmed platform balances",
    };
  }
  return { valid: true };
}

/**
 * Caps trade size relative to b so one order cannot violently move prices
 * when real USDC is at stake.
 */
export function getMaxTradeSize(b: number): number {
  if (!(b > 0) || !Number.isFinite(b)) {
    throw new Error("b must be a positive finite number");
  }
  return MAX_TRADE_TO_B_RATIO * b;
}

/**
 * Available USDC capacity for new REAL market commitments:
 * confirmed user balances minus losses already reserved on active markets.
 */
export function computePlatformReserve(
  totalConfirmedUserBalances: number,
  activeMarketsMaxLossSum: number
): number {
  return totalConfirmedUserBalances - activeMarketsMaxLossSum;
}
