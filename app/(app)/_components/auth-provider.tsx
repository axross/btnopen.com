import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { isClerkAvailable } from "@/runtime";

/**
 * Wraps the app in Clerk's provider only when Clerk is configured. Without it
 * (local dev without setup, CI, forked-PR previews) the tree renders unchanged
 * and the comment composer degrades to a disabled state.
 *
 * It roots no element of its own — it returns `children`, or `children` inside
 * `<ClerkProvider>` — so there is no root element for a `...props` spread to
 * reach.
 */
export function AuthProvider({
	children,
}: Readonly<{ children: ReactNode }>): ReactNode {
	if (!isClerkAvailable) {
		return children;
	}

	return <ClerkProvider>{children}</ClerkProvider>;
}
