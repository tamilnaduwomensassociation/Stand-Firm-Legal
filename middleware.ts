import { NextRequest, NextResponse } from "next/server";
import { readSession, SESSION_COOKIE } from "@/lib/server/session";

/**
 * Gate on /superadmin.
 *
 * This runs on the Edge runtime and imports only session.ts, which is
 * free of `node:` modules — importing auth.ts here would drag scrypt
 * in and fail the build. It verifies a cookie; it can never mint one.
 *
 * It is a fast fence, not the lock. Every route that actually returns
 * data calls `requireSuperadmin()` again on the Node runtime, so a
 * forged or expired cookie fails twice. /superadmin/login is exempt,
 * or signing in would be impossible.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/superadmin/login")) return NextResponse.next();

  const session = await readSession(req.cookies.get(SESSION_COOKIE)?.value);
  if (session?.role === "superadmin") return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/superadmin/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/superadmin/:path*"] };
