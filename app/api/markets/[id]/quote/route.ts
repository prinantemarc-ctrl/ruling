import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import {
  getDisplayCostToBuy,
  getDisplayProceedsFromSell,
  type Outcome,
} from "@/lib/lmsr";
import { toNumber } from "@/lib/money";
import { getMaxTradeSize } from "@/lib/risk";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url);
  const outcome = searchParams.get("outcome") as Outcome | null;
  const side = searchParams.get("side");
  const shares = Number(searchParams.get("shares"));

  if (
    (outcome !== "YES" && outcome !== "NO") ||
    (side !== "BUY" && side !== "SELL") ||
    !(shares > 0)
  ) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const auth = await requireSession();
  const market = await prisma.market.findUnique({ where: { id: params.id } });
  if (!market) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (market.tradingAccess === "INTERNAL" && !auth.user?.isInternal) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const qYes = toNumber(market.qYes);
  const qNo = toNumber(market.qNo);
  const b = toNumber(market.liquidityParam);
  const markup = toNumber(market.spreadMarkup);

  if (shares > getMaxTradeSize(b)) {
    return NextResponse.json(
      { error: "Shares exceed max trade size", max: getMaxTradeSize(b) },
      { status: 400 }
    );
  }

  const amount =
    side === "BUY"
      ? getDisplayCostToBuy(qYes, qNo, b, outcome, shares, markup)
      : getDisplayProceedsFromSell(qYes, qNo, b, outcome, shares, markup);

  return NextResponse.json({
    side,
    outcome,
    shares,
    amount,
    currency: market.currency === "REAL" ? "USDC" : "PLAY",
  });
}
