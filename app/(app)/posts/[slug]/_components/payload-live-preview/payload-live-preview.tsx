"use client";

import { RefreshRouteOnSave } from "@payloadcms/live-preview-react";
import { captureException } from "@sentry/nextjs";
import { type JSX, useCallback } from "react";
import { urlOrigin } from "@/runtime";
import { refresh } from "./refresh";

export function PayloadLivePreview({ path }: { path: string }): JSX.Element {
	const onRefresh = useCallback(() => {
		refresh(path).catch((error) => {
			captureException(error);
		});
	}, [path]);

	return <RefreshRouteOnSave refresh={onRefresh} serverURL={urlOrigin} />;
}
