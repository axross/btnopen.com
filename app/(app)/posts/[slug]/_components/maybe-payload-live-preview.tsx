import type { JSX } from "react";
import { urlOrigin } from "@/runtime";
import { PayloadLivePreview } from "./payload-live-preview";

/**
 * Subscribes to Payload's save events only on a `?preview=true` render, so the
 * page can place the subscription behind one `<Suspense>` without resolving the
 * search parameter itself.
 *
 * It roots no element — `<PayloadLivePreview>` renders nothing at all — so
 * there is no root element for a `...props` spread to reach, the same reason
 * `<AuthProvider>` takes none.
 */
export async function MaybePayloadLivePreview({
	slug: slugPromise,
	preview: previewPromise,
}: {
	slug: Promise<string>;
	preview?: Promise<boolean>;
}): Promise<JSX.Element | null> {
	const [slug, preview] = await Promise.all([slugPromise, previewPromise]);

	if (preview) {
		return (
			<PayloadLivePreview
				path={`/posts/${slug}?preview=true&draft=true`}
				serverURL={urlOrigin}
			/>
		);
	}

	return null;
}
