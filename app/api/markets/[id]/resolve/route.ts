import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { serializeMarket } from "@/lib/markets";
import { toDecimal, toNumber } from "@/lib/money";

const schema = z.object({
  outcome: z.enum(["YES", "NO"]),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, user } = await requireAdmin();
  if (error || !user) return error!;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const market = await prisma.$transaction(async (tx) => {
      const m = await tx.market.findUnique({ where: { id: params.id } });
      if (!m) throw new Error("NOT_FOUND");
      if (m.resolved) throw new Error("ALREADY");

      const winners = await tx.position.findMany({
        where: {
          marketId: m.id,
          outcome: parsed.data.outcome,
          sharesOwned: { gt: 0 },
        },
      });

      for (const pos of winners) {
        const payout = toNumber(pos.sharesOwned);
        const field = m.currency === "REAL" ? "balance" : "playBalance";
        await tx.user.update({
          where: { id: pos.userId },
          data: { [field]: { increment: toDecimal(payout) } },
        });
      }

      await tx.position.updateMany({
        where: { marketId: m.id },
        data: { sharesOwned: toDecimal(0) },
      });

      return tx.market.update({
        where: { id: m.id },
        data: {
          resolved: true,
          resolvedOutcome: parsed.data.outcome,
        },
      });
    });

    return NextResponse.json(serializeMarket(market));
  } catch (e) {
    const code = e instanceof Error ? e.message : "FAILED";
    if (code === "NOT_FOUND") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (code === "ALREADY") {
      return NextResponse.json({ error: "Already resolved" }, { status: 409 });
    }
    return NextResponse.json({ error: "Resolve failed" }, { status: 500 });
  }
}
