import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { serializeMarket } from "@/lib/markets";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const markets = await prisma.market.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(markets.map(serializeMarket));
}
