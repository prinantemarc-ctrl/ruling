import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { toDecimal, toNumber } from "@/lib/money";

export async function POST() {
  const { error, user } = await requireSession();
  if (error || !user) return error!;

  if (user.playFaucetClaimedAt) {
    return NextResponse.json(
      { error: "Play faucet already claimed" },
      { status: 409 }
    );
  }

  const amount = Number(process.env.PLAY_FAUCET_AMOUNT || "1000");
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      playBalance: { increment: toDecimal(amount) },
      playFaucetClaimedAt: new Date(),
    },
  });

  return NextResponse.json({
    playBalance: toNumber(updated.playBalance),
    claimed: amount,
  });
}
