import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { isAdminWallet } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  const walletAdmin = isAdminWallet(session.walletAddress);
  const isAdmin = Boolean(session.isAdmin || walletAdmin);
  return NextResponse.json({
    isAdmin,
    isLoggedIn: Boolean(session.isLoggedIn),
    walletAddress: session.walletAddress ?? null,
  });
}
