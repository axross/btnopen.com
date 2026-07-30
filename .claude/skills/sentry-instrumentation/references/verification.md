# Verifying the Integration

Apply this reference after wiring or changing anything in the Sentry integration, and when deciding what a test suite should assert about reporting.

Verified against `@sentry/react` and `@sentry/nextjs` 10.69.0 and `@sentry/react-native` 8.20.0.

## Configuration Is Not Evidence

Almost every failure mode in this skill is silent. A missing bundler wrapper, an upload that did not run, a bundler-specific option applied to the wrong bundler, a tunnel path swallowed by request matching, a missing server error hook — none of them fail a build or raise an error. The application runs, events may even arrive, and the gap surfaces during an incident.

So the standard for "wired" is an observed event, not a reviewed diff.

The check is one deliberate error from a production-like build, and it has four parts, all of which must hold:

1. The event **arrives** in the expected project.
2. Its stack trace is **resolved** to file and line, not minified.
3. It carries the expected **release** and, where applicable, **distribution**.
4. It carries the expected **environment**.

Any one of those failing points at a specific piece of wiring, which is what makes the check worth doing as four observations rather than one glance.

**Guidelines:**

- MUST trigger a deliberate error and confirm all four properties after any change to initialization, the bundler configuration, the build plugin, release derivation, or the upload.
- MUST perform the check against a production-like build; a development build resolves source through the development server and proves nothing about uploads.
- MUST NOT treat a passing build, a merged pull request, or a reviewed configuration as evidence that reporting works.
- SHOULD remove the deliberate trigger before release, or keep it behind a route or control that is unreachable in production.

## Keeping the SDK Inert in Tests

A test run that reaches a real client sends events from continuous integration, slows the suite, and makes assertions depend on the network. The cleanest arrangement follows from confining the vendor import to one module: tests replace that module and never touch the SDK at all.

Where something must exercise the SDK itself, an unset DSN disables sending while leaving the code paths intact.

**Guidelines:**

- MUST keep tests from reaching a real Sentry client, by replacing the project's wrapper module.
- MUST keep the wrapper mock's root-wrap export a pass-through, so wrapping does not change what a test renders.
- SHOULD leave the DSN unset in the test environment as a second line of defence, rather than relying on the mock alone.
- MUST NOT point tests at a real Sentry project as a way of asserting reporting; assert against the mock.

## Asserting That Reporting Happened

Reporting is behaviour, and where it matters it is worth asserting. The cases that earn a test are the ones where a failure is otherwise invisible: a caught error on a path that returns a fallback, a swallowed error in a background task, a boundary that renders a message instead of crashing.

Assert that the wrapper was called and roughly with what. Asserting the exact context object couples the test to a detail that will change; asserting nothing leaves the silent-failure path untested, which is the path most likely to regress.

**Guidelines:**

- MUST assert that a caught-and-swallowed error is reported, wherever swallowing it is the intended behaviour.
- SHOULD assert the error and the presence of context rather than the exact shape of the context object.
- SHOULD NOT assert reporting on paths where an error propagates normally and a boundary handles it; that duplicates the boundary's own test.

## What Local Checking Cannot Establish

Some things are unobservable outside a real build on a real device, and claiming them verified without one is the failure this section exists to prevent:

- **Native crash reporting** — a crash the process never survives cannot be produced in a development client.
- **Native symbol resolution** — depends on symbols uploaded by a release build.
- **Platform-termination reporting** — watchdog terminations and not-responding events need the operating system to do the killing.
- **Replay masking behaviour** — visual, and only assessable by watching a recording.
- **Browser profiling** — depends on a response header served by real infrastructure.
- **Over-the-air update resolution** — needs an actual published update installed on a device.

**Guidelines:**

- MUST state plainly which of these were not exercised when reporting on an integration change, rather than describing it as verified.
- MUST exercise native crash and symbol resolution on a release build before treating a mobile integration as complete.
- SHOULD watch an actual replay after any masking change, since no assertion covers it.
