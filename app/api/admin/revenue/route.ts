import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { toNumber } from "@/lib/money";

export async function GET(request: Request) {
  const { error, user } = await requireAdmin();
  if (error || !user) return error!;

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const createdAt: { gte?: Date; lte?: Date } = {};
  if (from) createdAt.gte = new Date(from);
  if (to) createdAt.lte = new Date(to);

  const agg = await prisma.trade.aggregate({
    where: Object.keys(createdAt).length ? { createdAt } : undefined,
    _sum: { platformMargin: true },
    _count: true,
  });

  const byMarket = await prisma.trade.groupBy({
    by: ["marketId"],
    where: Object.keys(createdAt).length ? { createdAt } : undefined,
    _sum: { platformMargin: true },
  });

  return NextResponse.json({
    totalPlatformMargin: toNumber(agg._sum.platformMargin ?? 0),
    tradeCount: agg._count,
    byMarket: byMarket.map((row) => ({
      marketId: row.marketId,
      platformMargin: toNumber(row._sum.platformMargin ?? 0),
    })),
  });
}
