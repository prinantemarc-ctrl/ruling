import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const schema = z.object({
  secret: z.string().min(8),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const expected = process.env.ADMIN_API_SECRET;
  if (!expected || parsed.data.secret !== expected) {
    return NextResponse.json({ error: "Invalid admin secret" }, { status: 401 });
  }

  const admin = await prisma.user.upsert({
    where: { walletAddress: "0xadmin000000000000000000000000000000000001" },
    create: {
      walletAddress: "0xadmin000000000000000000000000000000000001",
      isInternal: true,
    },
    update: { isInternal: true },
  });

  const session = await getSession();
  session.isLoggedIn = true;
  session.isAdmin = true;
  session.userId = admin.id;
  session.walletAddress = admin.walletAddress;
  await session.save();

  return NextResponse.json({ ok: true, isAdmin: true });
}
