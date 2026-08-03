import { Market, Prisma } from "@prisma/client";
import {
  getDisplayBuyPrice,
  getDisplaySellPrice,
  type Outcome,
} from "@/lib/lmsr";
import { toNumber } from "@/lib/money";

export function marketPrices(market: Market) {
  const qYes = toNumber(market.qYes);
  const qNo = toNumber(market.qNo);
  const b = toNumber(market.liquidityParam);
  const markup = toNumber(market.spreadMarkup);
  const outcomes: Outcome[] = ["YES", "NO"];
  const prices = Object.fromEntries(
    outcomes.map((outcome) => [
      outcome,
      {
        buy: getDisplayBuyPrice(qYes, qNo, b, outcome, markup),
        sell: getDisplaySellPrice(qYes, qNo, b, outcome, markup),
      },
    ])
  ) as Record<Outcome, { buy: number; sell: number }>;
  return prices;
}

export function serializeMarket(market: Market) {
  const prices = marketPrices(market);
  return {
    id: market.id,
    question: market.question,
    description: market.description,
    category: market.category,
    closesAt: market.closesAt.toISOString(),
    resolved: market.resolved,
    resolvedOutcome: market.resolvedOutcome,
    liquidityParam: toNumber(market.liquidityParam),
    maxLossAllowed: toNumber(market.maxLossAllowed),
    platformReserveSnapshot: toNumber(market.platformReserveSnapshot),
    spreadMarkup: toNumber(market.spreadMarkup),
    currency: market.currency,
    tradingAccess: market.tradingAccess,
    qYes: toNumber(market.qYes),
    qNo: toNumber(market.qNo),
    createdAt: market.createdAt.toISOString(),
    publishedAt: market.publishedAt?.toISOString() ?? null,
    prices,
  };
}

export function activeMarketWhere(): Prisma.MarketWhereInput {
  return {
    currency: "REAL",
    resolved: false,
    closesAt: { gt: new Date() },
  };
}
