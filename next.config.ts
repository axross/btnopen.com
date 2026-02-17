import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactCompiler: true,
	cacheComponents: true,
	images: {
		remotePatterns: [new URL("https://cdn.hashnode.com/res/hashnode/**")],
	},
	experimental: {
		viewTransition: true,
	},
};

export default nextConfig;
