"use server";

import { cookies } from "next/headers";
import { PayloadLocale } from "@/repositories/payload-types";
import { localeCookieName } from "./config";

// one year, expressed in seconds (365 days)
const cookieMaxAgeSeconds = 31_536_000;

/**
 * Persists the visitor's explicit locale choice in the locale cookie so it
 * overrides `Accept-Language` negotiation on subsequent requests.
 *
 * @throws if `locale` is not a supported {@link PayloadLocale} (a caller
 * invoking this server action directly can bypass the compile-time type).
 */
export async function setLocale(locale: PayloadLocale): Promise<void> {
	const parsed = PayloadLocale.parse(locale);
	const cookieStore = await cookies();

	cookieStore.set(localeCookieName, parsed, {
		maxAge: cookieMaxAgeSeconds,
		sameSite: "lax",
		path: "/",
	});
}
