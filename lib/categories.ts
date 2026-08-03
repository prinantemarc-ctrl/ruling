export const MARKET_CATEGORIES = [
  "POLITICS",
  "ELECTIONS",
  "GEOPOLITICS",
  "CONFLICTS",
  "ECONOMY",
  "CRYPTO",
  "TECH",
  "SCIENCE",
  "SPORTS",
  "ESPORTS",
  "CULTURE",
  "OTHER",
] as const;

export type MarketCategoryId = (typeof MARKET_CATEGORIES)[number];

export function isMarketCategory(value: string): value is MarketCategoryId {
  return (MARKET_CATEGORIES as readonly string[]).includes(value);
}
