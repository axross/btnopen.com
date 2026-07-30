# Source Maps and Debug Symbols

Apply this reference when wiring source-map upload, uploading native debug symbols, handling the build-time auth token, or investigating a stack trace that arrives minified.

Verified against `@sentry/nextjs` 10.69.0, `@sentry/react-native` 8.20.0, and `@sentry/cli` 3.6.2.

## How a Frame Gets Resolved

A production stack trace names minified files and column offsets. Sentry resolves it by matching the event against uploaded artifacts, and there are two mechanisms for that match.

**Debug IDs** are the default and the one to prefer: the bundler plugin injects an identifier into both the built file and its source map, and Sentry matches on that identifier alone. Nothing about the release has to line up for it to work.

**Release and dist** is the fallback, used when debug IDs are unavailable. Here the match is by identifier equality, so the values the application reports must be exactly the values the upload was filed under. Sentry's own troubleshooting names a mismatch here as the most common cause of unresolved frames.

The failure mode is characteristic and quiet: events arrive, they group, they alert — and every frame is minified. Nobody notices until an incident.

**Guidelines:**

- MUST let the bundler plugin inject debug IDs where the toolchain supports it, rather than relying on release/dist matching.
- MUST, where release/dist matching is in use, produce both values from one source shared by the application and the upload.
- MUST NOT ship source maps to end users; upload them and delete them from the build output.
- SHOULD verify a resolved frame after any change to the build, upload, or release wiring, rather than assuming the integration survived.

## Uploading, Per Build Type

Three build shapes upload differently, and a project can have more than one.

**A web build** uploads through the bundler plugin during the production build. The plugin generates maps, uploads them, and — by default — deletes them from the output afterwards. That deletion default is what keeps maps off the public origin, so turning it off is a deliberate act that needs a compensating control.

**A native mobile build** uploads during the platform build itself: a build phase on iOS, a build-tool plugin on Android. Both are wired by the SDK's setup and run without further intervention, which means a broken wiring is invisible until a report arrives minified. Development builds do not need any of this — the development server resolves source directly.

**An over-the-air update** ships new JavaScript without a new native build, so it needs its own upload step. Skipping it leaves every post-update report unresolved while the store build's maps remain perfectly valid and perfectly useless.

**Guidelines:**

- MUST upload source maps for every artifact that can produce a production event, including each over-the-air update.
- MUST keep the plugin's delete-after-upload behaviour on unless the build output is provably not publicly served.
- MUST NOT treat a passing build as evidence that upload succeeded; the upload step can fail without failing the build in several documented configurations.
- SHOULD run the SDK's setup tool for the initial wiring and read what it changed, rather than hand-assembling build phases.

## Native Debug Symbols

JavaScript source maps resolve JavaScript frames. A native crash — a signal on iOS, a JNI or NDK fault on Android — needs debug symbols instead, uploaded separately.

On iOS this is an additional build phase that uploads debug files. On Android it is the build-tool plugin, which also handles obfuscation mappings. The Android plugin carries a documented conflict worth knowing before it bites: its automatic dependency installation pulls a version of the native SDK that collides with the one the React Native SDK already bundles, so it is disabled in that arrangement.

**Guidelines:**

- MUST upload native debug symbols for any application that ships native code, in addition to source maps.
- MUST disable the Android build plugin's automatic dependency installation when the React Native SDK is present, so the bundled native SDK version wins.
- MUST upload obfuscation mappings wherever code shrinking is enabled, or every Android stack trace arrives unreadable.
- SHOULD confirm symbol upload separately from source-map upload; they fail independently.

## The Build-Time Token

The auth token authenticates uploads. It carries scopes against the Sentry organization, it belongs to the build, and it never belongs to the application.

Where it lives depends on the pipeline, but the rules do not vary:

| Context                | Where the token comes from        |
| ---------------------- | --------------------------------- |
| Local production build | An ignored local environment file |
| Continuous integration | The pipeline's secret storage     |
| A hosted build service | That service's secret storage     |

The failure to avoid is giving it a public environment prefix. That prefix means "inline this value into the bundle at build time" — so the token is not merely exposed, it is compiled into the artifact and shipped.

**Guidelines:**

- MUST supply the auth token from build-time secret storage, and never through a variable carrying the bundler's public prefix.
- MUST NOT commit an auth token, including a real value in an example environment file.
- MUST scope the token to what upload actually needs rather than reusing a broad organization token.
- SHOULD document in the project's own environment example that the token is build-time only, and why, since the distinction is invisible from the variable name.
- SHOULD keep organization and project slugs as plain configuration rather than secrets; masking them only makes build logs harder to read.

## Upload Environment Variables

A handful of environment variables change upload behaviour, and each exists for a specific situation rather than as a general switch.

- **Disabling automatic upload** suits a pipeline that uploads separately, or a local build that should not touch Sentry at all.
- **Tolerating upload failure** lets a build succeed when Sentry is unreachable, leaving the upload to be repeated later. It converts a hard failure into a silent gap, so it is a deliberate trade.
- **Setting the project root** matters in a monorepo, where the paths baked into a map otherwise do not match what the SDK reports.
- **Overriding the distribution value** matters in build systems that supply their own build number rather than the one in the project file.

**Guidelines:**

- MUST NOT enable failure tolerance as a default; it hides exactly the failure this whole wiring exists to prevent.
- MUST re-upload after any build that ran with upload disabled or tolerated a failure, before that build is treated as released.
- SHOULD set the project root explicitly in a monorepo rather than debugging path mismatches later.
- SHOULD record beside any of these variables why it is set, since each one reads as an optimization and behaves as a risk.
