# SDK and Wrapper

Apply this reference when adding Sentry to a project, choosing which `@sentry/*` package to depend on, deciding where the vendor import may appear, or reading a rule whose option names may have moved since it was written.

Verified against `@sentry/react` and `@sentry/nextjs` 10.69.0 and `@sentry/react-native` 8.20.0.

## Choosing the Package

Sentry publishes a framework package for each supported framework and a set of lower-level packages beneath them. The framework package re-exports the whole core API _and_ wires the runtimes, hooks, and integrations that framework needs. The lower-level packages do not: `@sentry/browser` knows nothing about a server runtime, `@sentry/node` knows nothing about a bundler's client output, and `@sentry/core` wires nothing at all.

Importing a lower-level package in an application that has a framework package available is the characteristic mistake. It compiles, it initializes, and it reports — while silently missing the instrumentation the framework package would have installed.

**Guidelines:**

- MUST depend on the framework package for the framework in use, and import every Sentry symbol from it.
- MUST NOT import from a lower-level package in an application that has a framework package available, even when the symbol is re-exported identically.
- MUST run one client per application; a second `init` call replaces the first rather than adding to it.
- MAY create an additional client deliberately for a genuinely separate surface — an embedded widget, a micro-frontend reporting to its own project — and MUST do so through the SDK's documented multi-client path rather than by calling `init` twice.

## One Module Owns the Vendor

Application code should not import `@sentry/*` directly. One module does, and everything else calls that module. This keeps the surface a vendor change touches to a single file, and — more usefully day to day — gives tests one thing to mock instead of a package spread across the tree.

That module's responsibilities are fixed; its export names are not. A project that already calls its reporter `trackError` should keep doing so.

**Example:**

```ts
// core/error-tracking.ts — the only module importing the SDK
import { captureException, init } from "@sentry/react-native";

export function initializeErrorTracker(): void {
  /* … */
}
export function trackError(error: unknown, context?: Record<string, unknown>) {
  /* … */
}
```

**Guidelines:**

- MUST confine the `@sentry/*` import for application-facing use to one module, and route application code through that module's exports.
- MUST have that module cover initialization, capture, breadcrumb recording, and the root-component wrap where the platform has one.
- MUST NOT prescribe export names; match whatever the host project already uses, and keep new names consistent with it.
- MUST leave the application functional when Sentry is unconfigured — an absent DSN disables reporting rather than failing the launch.
- SHOULD keep the module free of application logic, so it stays trivially mockable.

## The Framework-File Exemption

Some files exist specifically for the SDK to occupy. A framework's server-startup hook, its client-instrumentation entry, its per-runtime configuration modules, and its top-level error boundary are all places the framework's own documentation tells you to call Sentry from. Routing those through a project wrapper adds a layer without removing a dependency, because the file has no other purpose.

**Guidelines:**

- MUST allow a direct SDK import in a file whose sole purpose is SDK initialization or a framework-mandated SDK hook.
- MUST keep the exemption to those files; a feature module, a screen, a data layer, or a utility calls the wrapper.
- SHOULD name the exempt files explicitly in the project's own documentation, so the boundary is checkable rather than remembered.

## Test Doubles

A test run that reaches a real client sends events from CI, slows the suite, and couples assertions to network behaviour. Mocking the project's wrapper rather than the vendor package is what makes this cheap — one module to replace, and the mock's shape is the project's own API rather than Sentry's.

**Guidelines:**

- MUST provide a manual mock for the wrapper module alongside it, so a test opts in without writing a factory.
- MUST keep the mock's root-wrap export a pass-through, so wrapping does not change what a test renders.
- SHOULD assert against the mock when the behaviour under test is "this failure gets reported", rather than treating reporting as invisible.

## When the Installed SDK Disagrees

Every rule in this skill names the SDK line it was verified against. When the installed SDK is older or newer, that marker is the signal to check rather than to assume — and the React Native SDK in particular trails the JavaScript SDK, so an option present in one may be absent in the other.

Two renames are in flight and worth knowing by name, because Sentry's own quickstart snippets still show the superseded forms:

| Superseded           | Current                                         | Notes                                                                                                                                 |
| -------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `sendDefaultPii`     | `dataCollection`                                | `dataCollection` wins when both are set. The React Native options page still documents `sendDefaultPii` without a deprecation marker. |
| `profilesSampleRate` | `profileSessionSampleRate` + `profileLifecycle` | The pair replaces a single rate with a session rate plus a mode.                                                                      |

**Guidelines:**

- MUST consult the installed SDK's own options page before setting an option this skill marks as moving, rather than copying an option name from any snippet, including one in Sentry's own quickstart.
- MUST treat a rule whose verified-against line differs from the installed one as unconfirmed until checked.
- SHOULD record the installed SDK version beside any option set to work around a version-specific gap, so the workaround can be removed later.
- SHOULD read the migration guide for the line being crossed before a major upgrade; both lines raise platform floors at majors.
