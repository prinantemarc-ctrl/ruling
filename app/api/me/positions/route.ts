import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { marketPrices } from "@/lib/markets";
import { toNumber } from "@/lib/money";

export async function GET() {
  const { error, user } = await requireSession();
  if (error || !user) return error!;

  const positions = await prisma.position.findMany({
    where: { userId: user.id, sharesOwned: { gt: 0 } },
    include: { market: true },
    orderBy: { id: "asc" },
  });

  return NextResponse.json(
    positions.map((p) => {
      const prices = marketPrices(p.market);
      const shares = toNumber(p.sharesOwned);
      const sell = prices[p.outcome].sell;
      return {
        id: p.id,
        marketId: p.marketId,
        question: p.market.question,
        outcome: p.outcome,
        sharesOwned: shares,
        estimatedValue: shares * sell,
        marketResolved: p.market.resolved,
      };
    })
  );
}
