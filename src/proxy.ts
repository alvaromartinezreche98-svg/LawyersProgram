import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { CLERK_ENABLED, SIGN_IN_PATH, isPublicPath } from "@/lib/auth/config";

/*
 * With Clerk on, every page outside the public website needs a signed-in
 * user; others are sent to the access page with "?next=<page>", the same
 * return link the app already uses. This is an authentication check only: which cases a user may see is
 * for the backend to authorize on every request.
 */
const withClerk = clerkMiddleware(async (auth, req) => {
  if (isPublicPath(req.nextUrl.pathname)) return;
  const { userId } = await auth();
  if (userId) return;
  const url = new URL(SIGN_IN_PATH, req.url);
  url.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
});

export default function proxy(req: NextRequest, ev: NextFetchEvent) {
  return CLERK_ENABLED ? withClerk(req, ev) : NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next internals and static files, unless found in search params.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
