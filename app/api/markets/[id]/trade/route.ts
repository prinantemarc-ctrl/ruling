import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import {
  getCostToBuy,
  getDisplayCostToBuy,
  getDisplayProceedsFromSell,
  getPlatformMarginCaptured,
  getProceedsFromSell,
} from "@/lib/lmsr";
import { toDecimal, toNumber, toShareDecimal } from "@/lib/money";
import { getMaxTradeSize } from "@/lib/risk";

const schema = z.object({
  outcome: z.enum(["YES", "NO"]),
  shares: z.number().positive(),
  side: z.enum(["BUY", "SELL"]),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, user } = await requireSession();
  if (error || !user) return error!;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { outcome, shares, side } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const market = await tx.market.findUnique({ where: { id: params.id } });
      if (!market) throw new Error("NOT_FOUND");
      if (market.resolved || market.closesAt <= new Date()) {
        throw new Error("CLOSED");
      }
      if (market.tradingAccess === "INTERNAL" && !user.isInternal) {
        throw new Error("INTERNAL_ONLY");
      }

      const qYes = toNumber(market.qYes);
      const qNo = toNumber(market.qNo);
      const b = toNumber(market.liquidityParam);
      const markup = toNumber(market.spreadMarkup);

      if (shares > getMaxTradeSize(b)) throw new Error("MAX_SIZE");

      const freshUser = await tx.user.findUniqueOrThrow({
        where: { id: user.id },
      });
      const balanceField =
        market.currency === "REAL" ? "balance" : "playBalance";
      const balance = toNumber(freshUser[balanceField]);

      let fairAmount: number;
      let userAmount: number;
      let nextYes = qYes;
      let nextNo = qNo;
      let margin: number;

      if (side === "BUY") {
        fairAmount = getCostToBuy(qYes, qNo, b, outcome, shares);
        userAmount = getDisplayCostToBuy(qYes, qNo, b, outcome, shares, markup);
        margin = getPlatformMarginCaptured(fairAmount, userAmount);
        if (balance < userAmount) throw new Error("INSUFFICIENT");
        if (outcome === "YES") nextYes = qYes + shares;
        else nextNo = qNo + shares;

        await tx.user.update({
          where: { id: user.id },
          data: { [balanceField]: { decrement: toDecimal(userAmount) } },
        });

        const position = await tx.position.upsert({
          where: {
            userId_marketId_outcome: {
              userId: user.id,
              marketId: market.id,
              outcome,
            },
          },
          create: {
            userId: user.id,
            marketId: market.id,
            outcome,
            sharesOwned: toShareDecimal(shares),
          },
          update: {
            sharesOwned: { increment: toShareDecimal(shares) },
          },
        });
        void position;
      } else {
        const position = await tx.position.findUnique({
          where: {
            userId_marketId_outcome: {
              userId: user.id,
              marketId: market.id,
              outcome,
            },
          },
        });
        if (!position || toNumber(position.sharesOwned) < shares) {
          throw new Error("NO_POSITION");
        }
        fairAmount = getProceedsFromSell(qYes, qNo, b, outcome, shares);
        userAmount = getDisplayProceedsFromSell(
          qYes,
          qNo,
          b,
          outcome,
          shares,
          markup
        );
        margin = fairAmount - userAmount;
        if (outcome === "YES") nextYes = qYes - shares;
        else nextNo = qNo - shares;

        await tx.user.update({
          where: { id: user.id },
          data: { [balanceField]: { increment: toDecimal(userAmount) } },
        });
        await tx.position.update({
          where: { id: position.id },
          data: { sharesOwned: { decrement: toShareDecimal(shares) } },
        });
      }

      await tx.market.update({
        where: { id: market.id },
        data: {
          qYes: toShareDecimal(nextYes),
          qNo: toShareDecimal(nextNo),
        },
      });

      const priceAtTrade = userAmount / shares;
      const trade = await tx.trade.create({
        data: {
          userId: user.id,
          marketId: market.id,
          side,
          outcome,
          shares: toShareDecimal(shares),
          cost: toDecimal(userAmount),
          fairCost: toDecimal(fairAmount),
          priceAtTrade: toDecimal(priceAtTrade),
          platformMargin: toDecimal(margin),
        },
      });

      return trade;
    });

    return NextResponse.json({
      id: result.id,
      side: result.side,
      outcome: result.outcome,
      shares: toNumber(result.shares),
      cost: toNumber(result.cost),
      priceAtTrade: toNumber(result.priceAtTrade),
      platformMargin: toNumber(result.platformMargin),
    });
  } catch (e) {
    const code = e instanceof Error ? e.message : "FAILED";
    const map: Record<string, { status: number; error: string }> = {
      NOT_FOUND: { status: 404, error: "Market not found" },
      CLOSED: { status: 400, error: "Market closed" },
      INTERNAL_ONLY: { status: 403, error: "Market reserved for internal players" },
      MAX_SIZE: { status: 400, error: "Shares exceed max trade size" },
      INSUFFICIENT: { status: 400, error: "Insufficient balance" },
      NO_POSITION: { status: 400, error: "Insufficient position" },
    };
    const mapped = map[code] || { status: 500, error: "Trade failed" };
    return NextResponse.json({ error: mapped.error }, { status: mapped.status });
  }
}
