import { headers } from "next/headers";
import { rootLogger } from "@/logger";
import { allowedHosts } from "@/runtime";

const logger = rootLogger.child({ module: "🔧" });

export async function resolveUrlOrigin(): Promise<string> {
	const headerList = await headers();
	const host = headerList.get("host");

	if (host !== null && allowedHosts.has(host)) {
		return host.startsWith("localhost") ? `http://${host}` : `https://${host}`;
	}

	const fallbackHost = [...allowedHosts][0];

	logger.warn(
		{ requestedHost: host, fallbackHost },
		"Failed to resolve the self URL origin. Fallback to the first allowed host.",
	);

	return fallbackHost;
}
