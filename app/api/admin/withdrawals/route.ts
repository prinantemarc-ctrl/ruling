import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { toNumber } from "@/lib/money";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const rows = await prisma.withdrawRequest.findMany({
    include: { user: { select: { walletAddress: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(
    rows.map((w) => ({
      id: w.id,
      amount: toNumber(w.amount),
      destinationAddress: w.destinationAddress,
      status: w.status,
      txHash: w.txHash,
      createdAt: w.createdAt.toISOString(),
      walletAddress: w.user.walletAddress,
    }))
  );
}
