import { NextResponse } from "next/server";
import { SiweMessage } from "siwe";
import { prisma } from "@/lib/prisma";
import { isAdminWallet, normalizeAddress } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { toDecimal } from "@/lib/money";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, signature } = body as {
      message?: string;
      signature?: string;
    };
    if (!message || !signature) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const session = await getSession();
    const siwe = new SiweMessage(message);
    const result = await siwe.verify({
      signature,
      nonce: session.nonce,
    });

    if (!result.success) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const walletAddress = normalizeAddress(siwe.address);
    const existing = await prisma.user.findUnique({ where: { walletAddress } });
    const faucetAmount = Number(process.env.PLAY_FAUCET_AMOUNT || "1000");

    const user = await prisma.user.upsert({
      where: { walletAddress },
      create: {
        walletAddress,
        playBalance: toDecimal(faucetAmount),
        playFaucetClaimedAt: new Date(),
      },
      update: {},
    });

    // Welcome bonus if somehow created without faucet
    if (existing && !existing.playFaucetClaimedAt) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          playBalance: { increment: toDecimal(faucetAmount) },
          playFaucetClaimedAt: new Date(),
        },
      });
    }

    session.walletAddress = walletAddress;
    session.userId = user.id;
    session.isLoggedIn = true;
    session.isAdmin = isAdminWallet(walletAddress) || Boolean(session.isAdmin);
    session.nonce = undefined;
    await session.save();

    const fresh = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });

    return NextResponse.json({
      ok: true,
      isNew: !existing,
      user: {
        id: fresh.id,
        walletAddress: fresh.walletAddress,
        balance: fresh.balance.toString(),
        playBalance: fresh.playBalance.toString(),
        isInternal: fresh.isInternal,
        isAdmin: Boolean(session.isAdmin),
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Auth failed";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}
