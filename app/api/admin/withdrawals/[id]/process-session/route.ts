import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { toNumber } from "@/lib/money";

const schema = z.object({
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const withdrawal = await prisma.withdrawRequest.findUnique({
    where: { id: params.id },
  });
  if (!withdrawal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (withdrawal.status === "SENT") {
    return NextResponse.json({ error: "Already sent" }, { status: 409 });
  }

  const updated = await prisma.withdrawRequest.update({
    where: { id: params.id },
    data: {
      status: "SENT",
      txHash: parsed.data.txHash,
      processedAt: new Date(),
    },
  });

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    txHash: updated.txHash,
    amount: toNumber(updated.amount),
  });
}
