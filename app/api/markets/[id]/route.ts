import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { serializeMarket } from "@/lib/markets";
import { toNumber } from "@/lib/money";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireSession();
  const market = await prisma.market.findUnique({ where: { id: params.id } });
  if (!market) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (
    market.tradingAccess === "INTERNAL" &&
    !auth.user?.isInternal
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const trades = await prisma.trade.findMany({
    where: { marketId: market.id },
    orderBy: { createdAt: "asc" },
    take: 500,
  });

  return NextResponse.json({
    ...serializeMarket(market),
    trades: trades.map((t) => ({
      id: t.id,
      side: t.side,
      outcome: t.outcome,
      shares: toNumber(t.shares),
      cost: toNumber(t.cost),
      fairCost: toNumber(t.fairCost),
      priceAtTrade: toNumber(t.priceAtTrade),
      platformMargin: toNumber(t.platformMargin),
      createdAt: t.createdAt.toISOString(),
    })),
  });
}
