# Expo

Apply this reference when wiring Sentry into an Expo-managed application, instrumenting its router, uploading source maps for an over-the-air update, or reading the update context attached to its events.

Verified against `@sentry/react-native` 8.20.0. Everything in the React Native reference applies here as well; this file covers what a managed Expo application adds.

## Two Wirings, Neither Optional

A managed Expo application needs **two** separate pieces of wiring, and each does a different job. Installing the package and doing one of them produces an integration that looks configured and is not.

**The config plugin** — declared in the app config, or applied through its wrapper function in a dynamic config — performs the native-side setup and runs the upload during a native build. It carries the organization, project, and server URL.

**The bundler-configuration wrapper** replaces the default bundler config factory. It is what causes source maps to be generated in the first place.

The plugin without the wrapper uploads nothing useful, because there is nothing to upload. The wrapper without the plugin generates maps nobody sends. Neither failure produces an error at build time.

**Example:**

```js
// metro.config.js
const { getSentryExpoConfig } = require("@sentry/react-native/metro");

const config = getSentryExpoConfig(__dirname);
// project customization layered on top of the wrapper, not instead of it
```

**Guidelines:**

- MUST declare the config plugin in the app config and apply the bundler-configuration wrapper; each is necessary and neither is sufficient.
- MUST layer project bundler customization on top of the wrapper's returned config rather than starting from the platform default.
- MUST regenerate native projects after adding the plugin; the native side is unconfigured until then.
- SHOULD verify a release build produces a resolved frame, since neither missing wiring fails the build.

## Where Initialization Goes

Sentry's own Expo documentation initializes in the root layout. Initialize in the **entry module** instead, so initialization runs before the application's own modules evaluate rather than after the tree has begun mounting.

That placement buys less than it looks like it does: it does **not** precede the router's entry, because module imports are hoisted. The Expo framework capability owns that reasoning, the exact window entry-module placement covers, and the side-effect-module arrangement that closes the remaining gap — consult its error-tracker wiring rules before depending on initialization order.

**Guidelines:**

- MUST initialize in the entry module rather than the root layout, contrary to Sentry's own Expo snippet.
- MUST consult the Expo framework capability's error-tracker wiring rules for what entry-module placement does and does not achieve relative to the router, rather than assuming it runs first.
- MUST wrap the root layout's default export with the SDK's root wrapper, which is what installs the mobile instrumentation.

## Router Instrumentation

The SDK ships an integration for Expo's router that reads the router's navigation reference itself, so no manual reference wiring is needed. It produces a transaction per navigation, and options control time-to-display measurement, prefetch spans, and the handling of empty back-navigations.

Imperative navigation is not covered by the integration alone — a separate wrapper around the router object instruments the imperative methods.

Some capabilities depend on a development build rather than the general-purpose client application, so an option that works locally can be unavailable in the client app.

**Guidelines:**

- MUST install the router integration rather than a generic navigation integration in an Expo Router application.
- MUST wrap the router object where the application navigates imperatively, or those navigations produce no transaction.
- MUST gate any option unavailable in the general-purpose client application on a runtime check, rather than assuming a development build.
- SHOULD confirm transaction names arrive as route patterns, and strip sensitive route parameters per the content rules in [data-collection.md](./data-collection.md).

## Update Context

For an application shipping over-the-air updates, the SDK attaches an update context to every event automatically, carrying the running update's identifier, its channel, and its runtime version as searchable tags.

This is what makes an over-the-air deployment diagnosable at all: two devices on the same store version can be running different JavaScript, and the store version alone cannot distinguish them. It is also the natural source for the release and distribution values, per the rules in [identity-and-releases.md](./identity-and-releases.md).

The SDK additionally reports a warning-level event on its own when the update mechanism fails to load the latest update and falls back to the embedded bundle. That event is worth alerting on — it is a class of degradation that otherwise leaves no trace, because the application keeps working on older code.

**Guidelines:**

- MUST derive the distribution value from the update identity in an application shipping over-the-air updates, so each update's source maps resolve.
- SHOULD alert on the emergency-fallback event; a silent reversion to the embedded bundle is invisible otherwise.
- SHOULD use the update channel as the environment source, so preview and production updates separate without extra configuration.

## Source Maps for an Update

An over-the-air update ships new JavaScript without a new native build, so the native build's upload does not cover it. It needs its own upload step, run as part of publishing the update.

Skipping it is a quiet failure: the store build's maps remain valid and resolve nothing, so reports from every updated device arrive minified while the integration appears healthy.

**Guidelines:**

- MUST upload source maps as part of publishing every over-the-air update, not only during native builds.
- MUST use the same release and distribution values in that upload as the application reports at runtime.
- SHOULD make the upload part of the publish command rather than a separate step someone can forget.

## Build Pipeline and Tokens

The build service runs the plugin's upload, which needs the auth token from its own secret storage. Locally the same token comes from an ignored environment file. The token rules are the general ones: build-time only, never behind the public environment prefix, never committed.

The build service can also be connected to Sentry directly, which associates deployments with releases without additional configuration.

**Guidelines:**

- MUST supply the auth token through the build service's secret storage for hosted builds, and an ignored local environment file otherwise.
- MUST NOT give the token the public environment prefix, which would inline it into the shipped bundle.
- SHOULD document in the project's environment example that the token is build-time only and why, since the distinction is invisible from its name.

## Limits of the General-Purpose Client

The general-purpose Expo client application cannot run custom native code, so native crash reporting, native performance measurement, and some display-timing instrumentation are unavailable there. An integration that appears to do nothing in that client may be correctly configured and simply out of reach.

**Guidelines:**

- MUST verify Sentry behaviour in a development or release build rather than the general-purpose client, which cannot exercise the native side.
- MUST NOT conclude an integration is broken from its behaviour in that client alone.
- SHOULD gate options documented as unsupported there on a runtime check, so a single codebase runs in both.
