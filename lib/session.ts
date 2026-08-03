import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export type SessionData = {
  walletAddress?: string;
  userId?: string;
  isLoggedIn: boolean;
  nonce?: string;
  /** Set when authenticated via ADMIN_API_SECRET (backoffice). */
  isAdmin?: boolean;
};

export const sessionOptions: SessionOptions = {
  password:
    process.env.SIWE_SECRET ||
    "complex_password_at_least_32_characters_long_dev_only",
  cookieName: "ruling_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  },
};

export async function getSession() {
  return getIronSession<SessionData>(cookies(), sessionOptions);
}
