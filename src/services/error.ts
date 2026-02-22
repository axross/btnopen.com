import { isDevelopment, runtimeType } from "@/runtime";

export function trackError(error: Error): void {
	if (isDevelopment) {
		// biome-ignore lint/suspicious/noConsole: console output for development
		console.error(error);
	}

	resolveTrackErrorFn().then((trackErrorFn) => trackErrorFn(error));
}

let singletonTrackErrorFn: typeof trackError | null = null;

async function resolveTrackErrorFn(): Promise<typeof trackError> {
	if (!singletonTrackErrorFn) {
		if (runtimeType === "server") {
			const module = await import("./error.server");

			singletonTrackErrorFn = module.trackError;
		} else {
			const module = await import("./error.client");

			singletonTrackErrorFn = module.trackError;
		}
	}

	return singletonTrackErrorFn;
}
