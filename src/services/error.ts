import { isDevelopment, runtimeType } from "@/runtime";

export function trackError(error: Error): void {
	if (isDevelopment) {
		// biome-ignore lint/suspicious/noConsole: console output for development
		console.error(error);
	}

	// biome-ignore lint/nursery/noFloatingPromises: it needs module imports for the sake of isomorphism
	resolveTrackErrorFn().then((trackErrorFn) => trackErrorFn(error));
}

let singletonTrackErrorFn: typeof trackError | null = null;

async function resolveTrackErrorFn(): Promise<typeof trackError> {

	console.log("resolveTrackErrorFn()", singletonTrackErrorFn);

	if (singletonTrackErrorFn === null) {
		console.log(runtimeType);

		try {
			if (runtimeType === "client") {
				const module = await import("./error.client");

				singletonTrackErrorFn = module.trackError;
			} else {
				const module = await import("./error.server");

				console.log(module);

				singletonTrackErrorFn = module.trackError;
			}
		} catch (error) {
			console.error(error);

			throw error;
		}
	}

	console.log(singletonTrackErrorFn);

	return singletonTrackErrorFn;
}
