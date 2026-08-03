import { NextResponse } from "next/server";
import { SiweMessage } from "siwe";
import { prisma } from "@/lib/prisma";
import { normalizeAddress } from "@/lib/auth";
import { getSession } from "@/lib/session";

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
    const user = await prisma.user.upsert({
      where: { walletAddress },
      create: { walletAddress },
      update: {},
    });

    session.walletAddress = walletAddress;
    session.userId = user.id;
    session.isLoggedIn = true;
    session.nonce = undefined;
    await session.save();

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        balance: user.balance.toString(),
        playBalance: user.playBalance.toString(),
        isInternal: user.isInternal,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Auth failed";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}
