import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isClerkAvailable } from "@/runtime";

// `clerkMiddleware()` only attaches auth context (it protects nothing on its
// own), which is what `auth()` in the comment endpoint and post page need. When
// Clerk is not configured we skip it entirely so unconfigured environments run
// without credentials.
// biome-ignore lint/style/noDefaultExport: Next.js resolves middleware from this module's default export
export default isClerkAvailable ? clerkMiddleware() : () => NextResponse.next();

export const config = {
	// Run on the public app routes and the comment endpoint; skip Next internals,
	// static files, the Sentry tunnel, and the Payload admin/API so Payload's own
	// authentication is left untouched.
	matcher: ["/((?!_next|admin|api|monitoring|.*\\..*).*)"],
};
