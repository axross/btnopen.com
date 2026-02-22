import { initializeAnalytics } from "./services/analytics";
import { initializeClientErrorTracking } from "./services/error.client";

initializeClientErrorTracking();
initializeAnalytics();

// biome-ignore lint/performance/noBarrelFile: this is not a barrel file export
export { onRouterTransitionStart } from "./services/error.client";
