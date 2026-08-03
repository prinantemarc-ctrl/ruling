export type Outcome = "YES" | "NO";

function assertPositive(b: number, label = "b"): void {
  if (!(b > 0) || !Number.isFinite(b)) {
    throw new Error(`${label} must be a positive finite number`);
  }
}

function assertShares(shares: number): void {
  if (!(shares > 0) || !Number.isFinite(shares)) {
    throw new Error("shares must be a positive finite number");
  }
}

/** LMSR cost C(q) = b * ln(exp(qYes/b) + exp(qNo/b)), log-sum-exp stable. */
export function costFunction(qYes: number, qNo: number, b: number): number {
  assertPositive(b);
  const a = qYes / b;
  const c = qNo / b;
  const m = Math.max(a, c);
  return b * (m + Math.log(Math.exp(a - m) + Math.exp(c - m)));
}

/** Fair mid price for an outcome (never show raw to users — use display helpers). */
export function getPrice(
  qYes: number,
  qNo: number,
  b: number,
  outcome: Outcome
): number {
  assertPositive(b);
  const a = qYes / b;
  const c = qNo / b;
  const m = Math.max(a, c);
  const eYes = Math.exp(a - m);
  const eNo = Math.exp(c - m);
  const denom = eYes + eNo;
  return outcome === "YES" ? eYes / denom : eNo / denom;
}

/** Fair LMSR cost to buy `shares` of an outcome. */
export function getCostToBuy(
  qYes: number,
  qNo: number,
  b: number,
  outcome: Outcome,
  shares: number
): number {
  assertShares(shares);
  const nextYes = outcome === "YES" ? qYes + shares : qYes;
  const nextNo = outcome === "NO" ? qNo + shares : qNo;
  return costFunction(nextYes, nextNo, b) - costFunction(qYes, qNo, b);
}

/** Fair LMSR proceeds from selling `shares` of an outcome. */
export function getProceedsFromSell(
  qYes: number,
  qNo: number,
  b: number,
  outcome: Outcome,
  shares: number
): number {
  assertShares(shares);
  const nextYes = outcome === "YES" ? qYes - shares : qYes;
  const nextNo = outcome === "NO" ? qNo - shares : qNo;
  return costFunction(qYes, qNo, b) - costFunction(nextYes, nextNo, b);
}

/** Worst-case LMSR loss for the market maker: b * ln(n). */
export function getMaxLoss(b: number, nbOutcomes = 2): number {
  assertPositive(b);
  assertPositive(nbOutcomes, "nbOutcomes");
  return b * Math.log(nbOutcomes);
}

/** Liquidity parameter b needed so max loss ≈ maxLossTarget. */
export function getRequiredB(maxLossTarget: number, nbOutcomes = 2): number {
  assertPositive(maxLossTarget, "maxLossTarget");
  assertPositive(nbOutcomes, "nbOutcomes");
  return maxLossTarget / Math.log(nbOutcomes);
}

/** Display buy price = fair × (1 + markup/2). Never show getPrice raw. */
export function getDisplayBuyPrice(
  qYes: number,
  qNo: number,
  b: number,
  outcome: Outcome,
  markup: number
): number {
  return getPrice(qYes, qNo, b, outcome) * (1 + markup / 2);
}

/** Display sell price = fair × (1 - markup/2). */
export function getDisplaySellPrice(
  qYes: number,
  qNo: number,
  b: number,
  outcome: Outcome,
  markup: number
): number {
  return getPrice(qYes, qNo, b, outcome) * (1 - markup / 2);
}

/** User-facing buy cost with platform overround — use this in trading APIs. */
export function getDisplayCostToBuy(
  qYes: number,
  qNo: number,
  b: number,
  outcome: Outcome,
  shares: number,
  markup: number
): number {
  return getCostToBuy(qYes, qNo, b, outcome, shares) * (1 + markup / 2);
}

/** User-facing sell proceeds after platform overround. */
export function getDisplayProceedsFromSell(
  qYes: number,
  qNo: number,
  b: number,
  outcome: Outcome,
  shares: number,
  markup: number
): number {
  return getProceedsFromSell(qYes, qNo, b, outcome, shares) * (1 - markup / 2);
}

/** Margin captured on a buy (displayCost - rawCost) or sell (rawProceeds - displayProceeds). */
export function getPlatformMarginCaptured(
  rawAmount: number,
  displayAmount: number
): number {
  return displayAmount - rawAmount;
}
