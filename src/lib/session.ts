import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  username?: string;
  isLoggedIn?: boolean;
}

export const sessionOptions: SessionOptions = {
  // Must be at least 32 characters long
  password: process.env.SESSION_SECRET || "somesessionsecretatleast32characterslongforbagaskaracell",
  cookieName: "bagaskara_admin_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 2, // 2 hours session
  },
};

export async function getSession() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  return session;
}
