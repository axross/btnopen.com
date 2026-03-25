// biome-ignore-all lint/style/noProcessEnv: constants are based on env-vars
const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL;
let maybeUrlOrigin = "http://localhost:3000";

if (typeof vercelUrl === "string" && vercelUrl.length > 0) {
	if (URL.canParse(vercelUrl)) {
		maybeUrlOrigin = vercelUrl;
	} else {
		maybeUrlOrigin = `https://${vercelUrl}`;
	}
}

export const urlOrigin = maybeUrlOrigin;
