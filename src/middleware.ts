import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // If authenticated but needs username, redirect to register page routes only
    if (token?.needsUsername && !pathname.startsWith("/register")) {
      return NextResponse.redirect(new URL("/register", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Only protect page routes. API routes handle their own auth via getServerSession.
     * Exclude:
     * - /login              (sign-in page)
     * - /api/*              (all API routes — they do their own auth)
     * - /_next/*            (Next.js internals)
     * - /favicon.ico, static files
     */
    "/((?!login|user/|api/|_next/static|_next/image|favicon.ico|avatars).*)",
  ],
};
