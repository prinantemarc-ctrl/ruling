import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { toDecimal, toNumber } from "@/lib/money";

const schema = z.object({
  amount: z.number().positive(),
  destinationAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

export async function GET() {
  const { error, user } = await requireSession();
  if (error || !user) return error!;
  const rows = await prisma.withdrawRequest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(
    rows.map((w) => ({
      id: w.id,
      amount: toNumber(w.amount),
      destinationAddress: w.destinationAddress,
      txHash: w.txHash,
      status: w.status,
      createdAt: w.createdAt.toISOString(),
      processedAt: w.processedAt?.toISOString() ?? null,
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

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await prisma.withdrawRequest.findFirst({
    where: { userId: user.id, createdAt: { gte: oneHourAgo } },
  });
  if (recent) {
    return NextResponse.json(
      { error: "Rate limit: max 1 withdrawal per hour" },
      { status: 429 }
    );
  }

  const amount = toDecimal(parsed.data.amount);
  if (user.balance.lt(amount)) {
    return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
  }

  const withdrawal = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { balance: { decrement: amount } },
    });
    return tx.withdrawRequest.create({
      data: {
        userId: user.id,
        amount,
        destinationAddress: parsed.data.destinationAddress.toLowerCase(),
        status: "PENDING",
      },
    });
  });

  return NextResponse.json({
    id: withdrawal.id,
    amount: toNumber(withdrawal.amount),
    status: withdrawal.status,
  });
}
