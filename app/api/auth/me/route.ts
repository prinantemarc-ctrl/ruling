import { NextResponse } from "next/server";
import { isAdminWallet, requireSession } from "@/lib/auth";
import { toNumber } from "@/lib/money";
import { getSession } from "@/lib/session";

export async function GET() {
  const { error, user } = await requireSession();
  if (error || !user) return error!;
  const session = await getSession();
  return NextResponse.json({
    id: user.id,
    walletAddress: user.walletAddress,
    balance: toNumber(user.balance),
    playBalance: toNumber(user.playBalance),
    isInternal: user.isInternal,
    isAdmin: Boolean(session.isAdmin || isAdminWallet(user.walletAddress)),
    playFaucetClaimedAt: user.playFaucetClaimedAt?.toISOString() ?? null,
  });
}
