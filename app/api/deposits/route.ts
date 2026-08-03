import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { toDecimal, toNumber } from "@/lib/money";

const schema = z.object({
  amount: z.number().positive(),
});

export async function GET() {
  const { error, user } = await requireSession();
  if (error || !user) return error!;
  const deposits = await prisma.depositRequest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(
    deposits.map((d) => ({
      id: d.id,
      amount: toNumber(d.amount),
      txHash: d.txHash,
      status: d.status,
      createdAt: d.createdAt.toISOString(),
      confirmedAt: d.confirmedAt?.toISOString() ?? null,
    }))
  );
}

export async function POST(request: Request) {
  const { error, user } = await requireSession();
  if (error || !user) return error!;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const deposit = await prisma.depositRequest.create({
    data: {
      userId: user.id,
      amount: toDecimal(parsed.data.amount),
      status: "PENDING",
    },
  });

  return NextResponse.json({
    id: deposit.id,
    amount: toNumber(deposit.amount),
    status: deposit.status,
  });
}
