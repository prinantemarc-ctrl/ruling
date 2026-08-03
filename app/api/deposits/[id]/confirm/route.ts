import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { verifyUsdcDeposit } from "@/lib/chain";
import { toDecimal, toNumber } from "@/lib/money";

const schema = z.object({
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, user } = await requireSession();
  if (error || !user) return error!;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const deposit = await prisma.depositRequest.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!deposit) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (deposit.status !== "PENDING") {
    return NextResponse.json(
      { error: "Deposit already processed" },
      { status: 409 }
    );
  }

  const existingTx = await prisma.depositRequest.findUnique({
    where: { txHash: parsed.data.txHash },
  });
  if (existingTx) {
    return NextResponse.json({ error: "txHash already used" }, { status: 409 });
  }

  try {
    const onChain = await verifyUsdcDeposit({
      txHash: parsed.data.txHash,
      expectedFrom: user.walletAddress,
    });

    const updated = await prisma.$transaction(async (tx) => {
      const d = await tx.depositRequest.update({
        where: { id: deposit.id },
        data: {
          status: "CONFIRMED",
          txHash: parsed.data.txHash,
          amount: toDecimal(onChain.amount),
          confirmedAt: new Date(),
        },
      });
      await tx.user.update({
        where: { id: user.id },
        data: { balance: { increment: toDecimal(onChain.amount) } },
      });
      return d;
    });

    return NextResponse.json({
      id: updated.id,
      amount: toNumber(updated.amount),
      status: updated.status,
      txHash: updated.txHash,
    });
  } catch (e) {
    await prisma.depositRequest.update({
      where: { id: deposit.id },
      data: { status: "FAILED", txHash: parsed.data.txHash },
    });
    const msg = e instanceof Error ? e.message : "Verification failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
