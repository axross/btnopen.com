// biome-ignore-all lint/style/noProcessEnv: constants are based on env-vars
export const urlOrigin = process.env.NEXT_PUBLIC_VERCEL_URL
	? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
	: "http://localhost:3000";
