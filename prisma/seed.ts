import { PrismaClient, Outcome, TradeSide } from "@prisma/client";
import {
  getCostToBuy,
  getDisplayCostToBuy,
  getPlatformMarginCaptured,
  getPrice,
  getRequiredB,
} from "../lib/lmsr";

const prisma = new PrismaClient();

type SeedMarket = {
  question: string;
  description: string;
  closesAt: Date;
  bias: "YES" | "NO" | "MIXED";
  targetYes?: number;
};

const markets: SeedMarket[] = [
  {
    question: "Will Democrats control the U.S. House after the 2026 midterms?",
    description:
      "Resolves YES if the Democratic Party holds a majority of House seats after the 2026 elections.",
    closesAt: new Date("2026-11-04T12:00:00Z"),
    bias: "YES",
    targetYes: 0.72,
  },
  {
    question: "Will Republicans control the U.S. Senate after the 2026 midterms?",
    description:
      "Resolves YES if Republicans hold at least 51 Senate seats (or 50 + VP) after certification.",
    closesAt: new Date("2026-11-04T12:00:00Z"),
    bias: "MIXED",
    targetYes: 0.48,
  },
  {
    question: "Will Bitcoin trade above $150,000 at any point in 2026?",
    description:
      "Resolves YES if BTC/USD prints above 150,000 on a major exchange before Jan 1, 2027.",
    closesAt: new Date("2026-12-31T23:59:00Z"),
    bias: "MIXED",
    targetYes: 0.41,
  },
  {
    question: "Will Ethereum ETF spot AUM exceed $20B by end of 2026?",
    description:
      "Based on publicly reported aggregate AUM of U.S. spot ETH ETFs.",
    closesAt: new Date("2026-12-31T23:59:00Z"),
    bias: "YES",
    targetYes: 0.58,
  },
  {
    question: "Will the Fed cut rates at least twice before July 2026?",
    description:
      "YES if the FOMC delivers two or more rate cuts with effective dates before July 1, 2026.",
    closesAt: new Date("2026-12-15T00:00:00Z"),
    bias: "YES",
    targetYes: 0.63,
  },
  {
    question: "Will US CPI YoY print below 2.5% in any month of H2 2026?",
    description: "Uses BLS CPI-U year-over-year headline print.",
    closesAt: new Date("2027-01-15T00:00:00Z"),
    bias: "MIXED",
    targetYes: 0.44,
  },
  {
    question: "Will OpenAI launch a consumer GPT hardware device in 2026?",
    description:
      "YES if a first-party OpenAI-branded hardware device ships to consumers in 2026.",
    closesAt: new Date("2026-12-31T23:59:00Z"),
    bias: "NO",
    targetYes: 0.28,
  },
  {
    question: "Will Apple release a foldable iPhone by end of 2026?",
    description: "YES if Apple ships a foldable iPhone SKU to retail in 2026.",
    closesAt: new Date("2026-12-31T23:59:00Z"),
    bias: "NO",
    targetYes: 0.22,
  },
  {
    question: "Will SpaceX achieve an uncrewed Starship orbital catch in 2026?",
    description:
      "YES if SpaceX publicly demonstrates catching a returning Starship (or booster+ship stack milestone as announced) in 2026.",
    closesAt: new Date("2026-12-31T23:59:00Z"),
    bias: "YES",
    targetYes: 0.55,
  },
  {
    question: "Will NVIDIA be the world's most valuable public company on Dec 31, 2026?",
    description: "By market capitalization at US market close on Dec 31, 2026.",
    closesAt: new Date("2026-12-31T21:00:00Z"),
    bias: "MIXED",
    targetYes: 0.37,
  },
  {
    question: "Will France win the 2026 FIFA World Cup?",
    description: "Resolves YES if France is the tournament champion.",
    closesAt: new Date("2026-12-20T22:00:00Z"),
    bias: "MIXED",
    targetYes: 0.14,
  },
  {
    question: "Will the LA Lakers win the 2027 NBA Finals?",
    description: "YES if the Lakers are 2027 NBA champions.",
    closesAt: new Date("2027-06-30T00:00:00Z"),
    bias: "NO",
    targetYes: 0.11,
  },
  {
    question: "Will Taylor Swift announce a new studio album in 2026?",
    description:
      "YES if a new original studio album (not re-recording only) is officially announced in 2026.",
    closesAt: new Date("2026-12-31T23:59:00Z"),
    bias: "YES",
    targetYes: 0.61,
  },
  {
    question: "Will a Grok / xAI model top LMSYS Arena overall in 2026?",
    description:
      "YES if any xAI model is ranked #1 overall on LMSYS Chatbot Arena for at least one official snapshot in 2026.",
    closesAt: new Date("2026-12-31T23:59:00Z"),
    bias: "MIXED",
    targetYes: 0.33,
  },
  {
    question: "Will the EU pass a new AI liability directive vote in 2026?",
    description:
      "YES if the European Parliament holds a final affirmative vote on a dedicated AI liability instrument in 2026.",
    closesAt: new Date("2026-12-31T23:59:00Z"),
    bias: "YES",
    targetYes: 0.52,
  },
  {
    question: "Will crude oil (WTI) trade above $100 in 2026?",
    description: "YES if front-month WTI futures print above $100 any session in 2026.",
    closesAt: new Date("2026-12-31T23:59:00Z"),
    bias: "MIXED",
    targetYes: 0.35,
  },
  {
    question: "Will Uber complete an acquisition >$5B enterprise value in 2026?",
    description:
      "YES if Uber announces and signs a deal with EV > $5B that closes or is definitive in 2026.",
    closesAt: new Date("2026-12-31T23:59:00Z"),
    bias: "NO",
    targetYes: 0.19,
  },
  {
    question: "Will Solana flip Ethereum by market cap in 2026?",
    description: "YES if SOL fully diluted or circulating mcap exceeds ETH at any UTC day close.",
    closesAt: new Date("2026-12-31T23:59:00Z"),
    bias: "NO",
    targetYes: 0.08,
  },
  {
    question: "Will a Category 5 hurricane make U.S. landfall in 2026?",
    description: "YES per NHC classification at landfall on the U.S. coastline.",
    closesAt: new Date("2026-11-30T23:59:00Z"),
    bias: "MIXED",
    targetYes: 0.27,
  },
  {
    question: "Will Netflix lose net paid subscribers in any quarter of 2026?",
    description:
      "YES if Netflix reports a sequential decline in global paid memberships for any FY2026 quarter.",
    closesAt: new Date("2026-12-31T23:59:00Z"),
    bias: "NO",
    targetYes: 0.31,
  },
];

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function main() {
  console.log("Seeding Ruling.bet demo data…");

  // Clean previous demo trades/markets/positions (keep real users)
  await prisma.trade.deleteMany({});
  await prisma.position.deleteMany({});
  await prisma.market.deleteMany({});

  const bots = await Promise.all(
    Array.from({ length: 6 }).map((_, i) =>
      prisma.user.upsert({
        where: { walletAddress: `0xseed${i.toString().padStart(36, "0")}` },
        create: {
          walletAddress: `0xseed${i.toString().padStart(36, "0")}`,
          balance: 250000,
          playBalance: 5000,
          isInternal: i < 2,
        },
        update: {
          balance: 250000,
          playBalance: 5000,
          isInternal: i < 2,
        },
      })
    )
  );

  const maxLoss = 80;
  const b = getRequiredB(maxLoss, 2);

  for (let mIndex = 0; mIndex < markets.length; mIndex++) {
    const spec = markets[mIndex];
    const rand = mulberry32(1000 + mIndex);

    const market = await prisma.market.create({
      data: {
        question: spec.question,
        description: spec.description,
        closesAt: spec.closesAt,
        liquidityParam: b,
        maxLossAllowed: maxLoss,
        platformReserveSnapshot: 500000,
        spreadMarkup: 0.02,
        currency: "REAL",
        tradingAccess: "PUBLIC",
        publishedAt: new Date(Date.now() - (markets.length - mIndex) * 86400000),
        qYes: 0,
        qNo: 0,
      },
    });

    let qYes = 0;
    let qNo = 0;
    const target = spec.targetYes ?? 0.5;
    const tradeCount = 18 + Math.floor(rand() * 10);
    const start = Date.now() - (14 + mIndex) * 86400000;

    for (let t = 0; t < tradeCount; t++) {
      const pYes = getPrice(qYes, qNo, b, "YES");
      let outcome: Outcome = "YES";
      if (pYes < target - 0.03) outcome = "YES";
      else if (pYes > target + 0.03) outcome = "NO";
      else outcome = rand() > 0.5 ? "YES" : "NO";

      // occasional noise
      if (rand() < 0.18) outcome = outcome === "YES" ? "NO" : "YES";

      const shares = 2 + rand() * 12;
      const fairCost = getCostToBuy(qYes, qNo, b, outcome, shares);
      const userCost = getDisplayCostToBuy(qYes, qNo, b, outcome, shares, 0.02);
      const margin = getPlatformMarginCaptured(fairCost, userCost);
      const bot = bots[Math.floor(rand() * bots.length)];

      if (outcome === "YES") qYes += shares;
      else qNo += shares;

      const createdAt = new Date(start + t * ((12 * 3600 * 1000) + rand() * 3600 * 1000));

      await prisma.trade.create({
        data: {
          userId: bot.id,
          marketId: market.id,
          side: TradeSide.BUY,
          outcome,
          shares,
          cost: userCost,
          fairCost,
          priceAtTrade: userCost / shares,
          platformMargin: margin,
          createdAt,
        },
      });

      await prisma.position.upsert({
        where: {
          userId_marketId_outcome: {
            userId: bot.id,
            marketId: market.id,
            outcome,
          },
        },
        create: {
          userId: bot.id,
          marketId: market.id,
          outcome,
          sharesOwned: shares,
        },
        update: {
          sharesOwned: { increment: shares },
        },
      });

      await prisma.user.update({
        where: { id: bot.id },
        data: { balance: { decrement: userCost } },
      });
    }

    await prisma.market.update({
      where: { id: market.id },
      data: { qYes, qNo },
    });

    console.log(
      `✓ ${market.question.slice(0, 64)}… pYES≈${(
        getPrice(qYes, qNo, b, "YES") * 100
      ).toFixed(1)}% (${tradeCount} trades)`
    );
  }

  console.log(`Seeded ${markets.length} markets with price histories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
