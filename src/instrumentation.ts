import { initializeServerErrorTracking } from "./services/error.server";

export async function register() {
	initializeServerErrorTracking();
}

// biome-ignore lint/performance/noBarrelFile: this is not a barrel file export
export { onRequestError } from "./services/error.server";
