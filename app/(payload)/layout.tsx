/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from "@/payload-config";
import "@payloadcms/next/css";
import { handleServerFunctions, RootLayout } from "@payloadcms/next/layouts";
import type { ServerFunctionClient } from "payload";
import type { ReactNode } from "react";
import { importMap } from "./admin/importMap.js";
import "./custom.scss";

interface LayoutProps {
	children: ReactNode;
}

const serverFunction: ServerFunctionClient = async (args) => {
	"use server";

	return handleServerFunctions({ ...args, config, importMap });
};

export default async function Layout({ children }: LayoutProps) {
	return (
		<RootLayout
			config={config}
			importMap={importMap}
			serverFunction={serverFunction}
		>
			{children}
		</RootLayout>
	);
}
