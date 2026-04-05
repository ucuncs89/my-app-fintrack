import { type NextRequest, NextResponse } from "next/server";

const DASHBOARD_PATHS = [
  "/",
  "/transactions",
  "/accounts",
  "/asset-catalog",
  "/portfolio",
  "/budget",
  "/reports",
  "/settings",
];
const AUTH_PATHS = ["/sign-in", "/sign-up"];

const isDashboardPath = (pathname: string): boolean => {
  if (pathname === "/") return true;
  return DASHBOARD_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
};

const isAuthPath = (pathname: string): boolean =>
  AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

export default async function middleware(
  request: NextRequest,
): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;

  let session: Record<string, unknown> | null = null;
  try {
    const res = await fetch(`${request.nextUrl.origin}/api/auth/get-session`, {
      headers: {
        cookie: request.headers.get("cookie") ?? "",
      },
    });
    if (res.ok) {
      session = (await res.json()) as Record<string, unknown>;
    }
  } catch {
    // session remains null
  }

  if (isAuthPath(pathname)) {
    if (session) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (isDashboardPath(pathname) && !session) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/transactions/:path*",
    "/accounts/:path*",
    "/asset-catalog/:path*",
    "/portfolio/:path*",
    "/budget/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/sign-in",
    "/sign-up",
  ],
};
