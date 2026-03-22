/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */

import { generatePageMetadata, NotFoundPage } from "@payloadcms/next/views";
import type { Metadata } from "next";
import config from "@/payload-config";
import { importMap } from "../importMap";

interface PageProps {
	params: Promise<{ segments: string[] }>;
	searchParams: Promise<Record<string, string | string[]>>;
}

export function generateMetadata({
	params,
	searchParams,
}: PageProps): Promise<Metadata> {
	return generatePageMetadata({ config, params, searchParams });
}

export default function NotFound({ params, searchParams }: PageProps) {
	return NotFoundPage({ config, params, searchParams, importMap });
}
