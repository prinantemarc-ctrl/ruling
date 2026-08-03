import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { toNumber } from "@/lib/money";

export async function GET() {
  const { error, user } = await requireSession();
  if (error || !user) return error!;
  return NextResponse.json({
    id: user.id,
    walletAddress: user.walletAddress,
    balance: toNumber(user.balance),
    playBalance: toNumber(user.playBalance),
    isInternal: user.isInternal,
    playFaucetClaimedAt: user.playFaucetClaimedAt?.toISOString() ?? null,
  });
}
