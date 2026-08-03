import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { toNumber } from "@/lib/money";

export async function GET() {
  const { error, user } = await requireSession();
  if (error || !user) return error!;

  const trades = await prisma.trade.findMany({
    where: { userId: user.id },
    include: { market: { select: { question: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(
    trades.map((t) => ({
      id: t.id,
      marketId: t.marketId,
      question: t.market.question,
      side: t.side,
      outcome: t.outcome,
      shares: toNumber(t.shares),
      cost: toNumber(t.cost),
      priceAtTrade: toNumber(t.priceAtTrade),
      createdAt: t.createdAt.toISOString(),
    }))
  );
}
