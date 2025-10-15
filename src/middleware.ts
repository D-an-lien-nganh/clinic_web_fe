import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const shouldHandle = !(
    (request.nextUrl.pathname.startsWith("/_next") || request.nextUrl.pathname.includes(".")) // Bỏ qua các tài nguyên tĩnh
  );

  if (!shouldHandle) {
    return NextResponse.next();
  }
  const token = request.cookies.get("access_token");

  const publicPaths = ["/login", "/"];

  if (request.nextUrl.pathname === "/") {
    if (token) {
      return NextResponse.redirect(new URL("/app", request.url));
    } else {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (request.nextUrl.pathname === "/login" && token) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  if (!token && !publicPaths.includes(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
