import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const response = NextResponse.next();

  // Protect /admin routes
  if (path.startsWith("/admin")) {
    const session = await getIronSession<SessionData>(request, response, sessionOptions);

    if (path === "/admin/login") {
      if (session.isLoggedIn) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    } else {
      if (!session.isLoggedIn) {
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
