import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSession } from "@/lib/auth";
import { getRequiredB } from "@/lib/lmsr";
import { activeMarketWhere, serializeMarket } from "@/lib/markets";
import { toDecimal, toNumber } from "@/lib/money";
import {
  computePlatformReserve,
  validateMarketCreation,
} from "@/lib/risk";

const createSchema = z.object({
  question: z.string().min(3),
  description: z.string().min(1),
  closesAt: z.string().datetime(),
  maxLossAllowed: z.number().positive(),
  spreadMarkup: z.number().min(0).optional(),
  currency: z.enum(["REAL", "PLAY"]).optional(),
});

export async function GET() {
  const auth = await requireSession();
  const isInternal = Boolean(auth.user?.isInternal);

  const list = await prisma.market.findMany({
    where: {
      resolved: false,
      closesAt: { gt: new Date() },
      ...(isInternal ? {} : { tradingAccess: "PUBLIC" as const }),
    },
    orderBy: { closesAt: "asc" },
  });

  return NextResponse.json(list.map(serializeMarket));
}

export async function POST(request: Request) {
  const { error, user } = await requireAdmin();
  if (error || !user) return error!;

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const currency = parsed.data.currency ?? "REAL";
  const spreadMarkup = parsed.data.spreadMarkup ?? 0.02;
  const maxLossAllowed = parsed.data.maxLossAllowed;
  const b = getRequiredB(maxLossAllowed, 2);

  let platformReserveSnapshot = 0;

  if (currency === "REAL") {
    const balances = await prisma.user.aggregate({
      _sum: { balance: true },
    });
    const totalBalances = toNumber(balances._sum.balance ?? 0);
    const active = await prisma.market.findMany({
      where: activeMarketWhere(),
      select: { maxLossAllowed: true },
    });
    const activeSum = active.reduce(
      (s, m) => s + toNumber(m.maxLossAllowed),
      0
    );
    const validation = validateMarketCreation(
      maxLossAllowed,
      totalBalances,
      activeSum
    );
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.reason || "Insufficient reserve" },
        { status: 400 }
      );
    }
    platformReserveSnapshot = computePlatformReserve(totalBalances, activeSum);
  }

  const market = await prisma.market.create({
    data: {
      question: parsed.data.question,
      description: parsed.data.description,
      closesAt: new Date(parsed.data.closesAt),
      maxLossAllowed: toDecimal(maxLossAllowed),
      liquidityParam: toDecimal(b),
      spreadMarkup: toDecimal(spreadMarkup),
      currency,
      tradingAccess: "INTERNAL",
      platformReserveSnapshot: toDecimal(platformReserveSnapshot),
      qYes: toDecimal(0),
      qNo: toDecimal(0),
    },
  });

  return NextResponse.json(serializeMarket(market), { status: 201 });
}
