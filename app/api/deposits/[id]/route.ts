import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { toNumber } from "@/lib/money";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { error, user } = await requireSession();
  if (error || !user) return error!;

  const deposit = await prisma.depositRequest.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!deposit) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: deposit.id,
    amount: toNumber(deposit.amount),
    txHash: deposit.txHash,
    status: deposit.status,
    createdAt: deposit.createdAt.toISOString(),
    confirmedAt: deposit.confirmedAt?.toISOString() ?? null,
  });
}
