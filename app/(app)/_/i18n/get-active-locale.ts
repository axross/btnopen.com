import "server-only";
import { getLocale } from "next-intl/server";
import { PayloadLocale } from "@/repositories/payload-types";
import { defaultLocale } from "./config";

/**
 * The locale negotiated for the current request, validated as a
 * {@link PayloadLocale} so it can be passed straight into Payload queries.
 * Falls back to {@link defaultLocale} if next-intl ever yields an unexpected
 * value.
 */
export async function getActiveLocale(): Promise<PayloadLocale> {
	return PayloadLocale.catch(defaultLocale).parse(await getLocale());
}
