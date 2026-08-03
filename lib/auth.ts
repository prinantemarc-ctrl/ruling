import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

export function getAdminWallets(): Set<string> {
  const raw = process.env.ADMIN_WALLET_ADDRESSES || "";
  return new Set(
    raw
      .split(",")
      .map((a) => a.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isAdminWallet(address: string | undefined | null): boolean {
  if (!address) return false;
  return getAdminWallets().has(address.toLowerCase());
}

export async function requireSession() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId || !session.walletAddress) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      session: null,
      user: null,
    };
  }
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      session: null,
      user: null,
    };
  }
  return { error: null, session, user };
}

export async function requireAdmin() {
  const session = await getSession();

  // Path A: admin secret session (backoffice login)
  if (session.isAdmin && session.isLoggedIn) {
    if (session.userId) {
      const user = await prisma.user.findUnique({ where: { id: session.userId } });
      if (user) return { error: null, session, user };
    }
    // Synthetic admin user for secret-only login
    const admin = await prisma.user.upsert({
      where: { walletAddress: "0xadmin000000000000000000000000000000000001" },
      create: {
        walletAddress: "0xadmin000000000000000000000000000000000001",
        isInternal: true,
        balance: 0,
      },
      update: { isInternal: true },
    });
    session.userId = admin.id;
    session.walletAddress = admin.walletAddress;
    await session.save();
    return { error: null, session, user: admin };
  }

  const result = await requireSession();
  if (result.error || !result.user) return result;
  if (!isAdminWallet(result.user.walletAddress) && !session.isAdmin) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      session: null,
      user: null,
    };
  }
  return result;
}

export function requireAdminSecret(request: Request): NextResponse | null {
  const secret = process.env.ADMIN_API_SECRET;
  const header = request.headers.get("x-admin-secret");
  if (!secret || header !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
