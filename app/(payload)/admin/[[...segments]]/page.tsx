/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import { generatePageMetadata, RootPage } from "@payloadcms/next/views";
import type { Metadata } from "next";
import config from "@/payload-config";
import { importMap } from "../importMap";

interface PageProps {
	params: Promise<{ segments: string[] }>;
	searchParams: Promise<Record<string, string | string[]>>;
}

export async function generateMetadata({
	params,
	searchParams,
}: PageProps): Promise<Metadata> {
	return generatePageMetadata({ config, params, searchParams });
}

export default function Page({ params, searchParams }: PageProps) {
	return RootPage({ config, params, searchParams, importMap });
}
