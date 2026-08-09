# React Native

Apply this reference when wiring Sentry into a React Native application, uploading its symbols, instrumenting navigation, or diagnosing a documented platform failure.

Verified against `@sentry/react-native` 8.20.0, checked against [Sentry's React Native documentation](https://docs.sentry.io/platforms/react-native/) on **2026-08-02**. An Expo-managed application has additional required wiring covered in [expo.md](./expo.md); everything here applies there too.

## One Package, Three Crash Classes

The React Native SDK is not a JavaScript SDK with a mobile flavour. It bundles the native iOS and Android SDKs and reports three distinct classes of failure: JavaScript errors, native crashes, and platform-level terminations the process never sees — watchdog terminations, application hangs, and not-responding events.

That last class is the reason the native side matters. A JavaScript-only integration reports nothing when the operating system kills the application, which is precisely the failure a user experiences as the app disappearing.

Options exist to disable each piece. They are worth knowing so they are not disabled by accident while debugging and left that way.

**Guidelines:**

- MUST leave native crash handling enabled in release builds; disabling it removes the crash class users notice most.
- MUST NOT ship a build with native reporting disabled because it was turned off during local debugging; verify it in the release configuration.
- SHOULD confirm which platform-termination classes the installed SDK version reports, since coverage has expanded across majors.

## Setup: Wizard or Manual

The SDK ships a setup tool that installs the package, wires the bundler, adds the native build steps, and writes the configuration. It is the recommended route and it is worth reading its diff rather than accepting it blindly — it edits native build files, and knowing what it changed is what makes the next upgrade tractable.

Manual setup is documented for projects the tool cannot handle: an unusual native project layout, a monorepo, multiple schemes or build variants. It is the same steps performed by hand, and the one most often missed is the bundler wrapper.

**Guidelines:**

- MUST review what the setup tool changed before committing it, particularly in native build files.
- MUST complete every manual step where the tool is not used; a partially wired integration reports events and resolves nothing.
- SHOULD keep a properties file per scheme or variant where the project has more than one, rather than assuming a single configuration applies.

## The Bundler Wrapper

The SDK provides a wrapper for the bundler configuration, and it is the step without which source maps are not generated at all. Everything downstream — the upload during the native build, the resolved frames in a report — depends on it.

Its absence is invisible until an incident. The build succeeds, the application runs, events arrive, and every frame is minified.

**Guidelines:**

- MUST apply the SDK's bundler-configuration wrapper as the base of the project's bundler config, then layer project customization on top of it.
- MUST NOT replace the wrapper with the platform's default configuration factory while keeping the rest of the Sentry wiring; the two are not interchangeable.
- SHOULD verify a resolved frame from a release build after any change to the bundler configuration, per the rules in [source-maps-and-tokens.md](./source-maps-and-tokens.md).

## Native Symbols and the Build-Tool Conflict

Native crashes need debug symbols, uploaded separately from source maps: an additional build phase on iOS, the build-tool plugin on Android.

The Android plugin carries a documented conflict. Its automatic dependency installation pulls a version of the native SDK that collides with the one the React Native SDK already bundles, producing a version mismatch. Disabling that automatic installation is the documented resolution, leaving the React Native SDK to manage its own native dependency.

Two further Android build settings interfere with uploads: an on-demand configuration mode that skips the upload task on some builds, and code shrinking, whose obfuscation mappings must be uploaded or every stack trace arrives unreadable.

**Guidelines:**

- MUST disable the Android build plugin's automatic dependency installation when the React Native SDK is present.
- MUST upload obfuscation mappings wherever code shrinking is enabled.
- SHOULD keep on-demand configuration off where it causes uploads to be skipped, rather than discovering the gap during an incident.
- MUST configure a distinct distribution value per platform where one release ships both, or the platforms' source maps overwrite each other.

## Automatic Instrumentation

Wrapping the root component installs the SDK's own instrumentation. What it provides is largely mobile-specific and not obtainable another way:

- **Application start**, cold and warm, measured from native process initialization rather than from first render
- **Slow and frozen frames**, which is how jank appears in telemetry at all
- **Event-loop stalls**, distinguishing a blocked JavaScript thread from a slow native one
- **Time to initial and full display**, per navigation
- **Requests**, as spans under the operation that made them
- **User interaction**, as spans and breadcrumbs

**Guidelines:**

- MUST wrap the root component; without it most of the above does not exist and the SDK's error boundary is absent too.
- MUST keep the application's own top-level error boundary regardless of the wrap, which reports rather than presenting a usable screen.
- SHOULD filter development-server requests out of span creation, or a development build produces an unbounded stream of spans.
- SHOULD verify interaction breadcrumbs carry legible names in a release build, per the rules in [delivery-and-footprint.md](./delivery-and-footprint.md) on name preservation.

## Navigation Instrumentation

Navigation instrumentation is what produces a transaction per screen and a route name on every event. The SDK ships an integration per navigation library, and the correct one depends on which library the application uses.

Route parameters are the hazard here: the integration captures them automatically, and a route parameterized on something sensitive sends it with every transaction. Newer SDK versions redact more by default, but the application still owns what its own routes carry.

**Guidelines:**

- MUST install the navigation integration matching the navigation library in use.
- MUST strip sensitive route parameters, in the transaction send hook or through server-side scrubbing, per the content rules in [data-collection.md](./data-collection.md).
- SHOULD confirm transaction names arrive as route patterns rather than concrete paths after wiring.

## Documented Failure Modes

The SDK's troubleshooting documentation is unusually load-bearing for this platform, and the recurring themes are worth knowing before they cost a day:

- **Unresolved frames** almost always trace to a release or distribution mismatch, a missing bundler wrapper, or a build that uploaded nothing.
- **Native toolchain conflicts** arise where another tool wraps the same build phase, or where a build system supplies its own build number rather than the one in the project file.
- **Environment resolution** fails where a version-managed runtime is not on the path the native build sees.
- **Unhandled promise rejections** may go uncaught depending on the platform version; the SDK warns when its handler did not attach.

**Guidelines:**

- MUST consult the SDK's troubleshooting documentation for the installed version before treating a symptom as novel; most are documented with a known fix.
- MUST check for another tool wrapping the same native build phase when uploads stop working after adding an unrelated dependency.
- SHOULD act on the SDK's own startup warnings rather than filtering them out of the log.
