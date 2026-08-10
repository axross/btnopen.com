"use client";

import { captureException } from "@sentry/nextjs";
import { useTranslations } from "next-intl";
import { type JSX, useEffect } from "react";
import { StateMessage, StateMessageAction } from "@/components/state-message";
import { resolveRenderFailure } from "@/helpers/render-failure";

/**
 * The error boundary for everything under `(app)`. It renders inside the root
 * layout, so a reader who hits a failing route keeps the site header and the
 * locale provider and lands on a first-party surface instead of Next's
 * built-in error page.
 *
 * What the surface says, and whether it offers a retry, comes from
 * `resolveRenderFailure()` — nothing in this body reads the error itself.
 */
export default function AppError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}): JSX.Element {
	const t = useTranslations("error");
	const { messageKey, retryLabelKey } = resolveRenderFailure(error);

	// this boundary is where a client-side render failure is observed;
	// `onRequestError` in instrumentation.ts already covers the server side, and
	// `global-error.tsx` covers a failure in the root layout itself.
	useEffect(() => {
		captureException(error);
	}, [error]);

	return (
		<StateMessage
			message={t(messageKey)}
			action={
				retryLabelKey === null ? undefined : (
					// `reset` re-renders the failed region in place rather than
					// reloading the document, which is why the control is a button.
					<StateMessageAction onClick={reset}>
						{t(retryLabelKey)}
					</StateMessageAction>
				)
			}
			data-testid="error"
		/>
	);
}
