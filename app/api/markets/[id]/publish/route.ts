import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { serializeMarket } from "@/lib/markets";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { error, user } = await requireAdmin();
  if (error || !user) return error!;

  const market = await prisma.market.findUnique({ where: { id: params.id } });
  if (!market) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.market.update({
    where: { id: market.id },
    data: {
      tradingAccess: "PUBLIC",
      publishedAt: new Date(),
    },
  });

  return NextResponse.json(serializeMarket(updated));
}
