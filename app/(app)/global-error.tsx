"use client";

import { captureException } from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";
import { defaultLocale, htmlLangByLocale } from "@/i18n/config";

export default function GlobalError({
	error,
}: {
	error: Error & { digest?: string };
}) {
	useEffect(() => {
		captureException(error);
	}, [error]);

	return (
		// this top-level error boundary renders outside the next-intl provider,
		// so it cannot resolve the negotiated locale; fall back to the default.
		<html lang={htmlLangByLocale[defaultLocale]}>
			<body>
				{/* `NextError` is the default Next.js error page component. Its type
        definition requires a `statusCode` prop. However, since the App Router
        does not expose status codes for errors, we simply pass 0 to render a
        generic error message. */}
				<NextError statusCode={0} />
			</body>
		</html>
	);
}
