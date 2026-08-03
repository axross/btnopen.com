# Cron Monitors

Apply this reference when instrumenting a scheduled job so Sentry notices it failing, stalling, or not running at all.

Verified against `@sentry/nextjs` 10.69.0. `withMonitor` requires SDK 7.76.0+; the failure and recovery thresholds require 8.7.0+.

## Reporting a Job's Outcome

A scheduled job that throws produces an error event like anything else. A scheduled job that never runs produces nothing, which is why it needs a monitor: Sentry knows when a check-in was expected and can alert on its absence.

Two APIs cover this. A wrapper runs the job and handles start and finish check-ins around it, which is the right choice for a job with a single body. A lower-level check-in call marks start and outcome explicitly, which is what a job with several exit paths or an out-of-process completion needs.

**Guidelines:**

- MUST wrap a scheduled job rather than relying on error reporting alone; an error event cannot represent a job that did not run.
- MUST report a failing outcome explicitly where the job catches its own errors, or a failed run checks in as successful.
- SHOULD prefer the wrapper for a single-bodied job and the explicit check-in only where the wrapper cannot express the job's shape.
- MUST keep check-in calls out of the job's own error path in a way that lets a reporting failure fail the job; telemetry is not the work.

## Describing the Schedule

A monitor's configuration tells Sentry what to expect: the schedule as a crontab expression or an interval, the timezone it is interpreted in, how long a check-in may be late before it counts as missed, and how long a run may take before it counts as timed out. Two further thresholds control how many consecutive failures create an issue and how many successes resolve it, which is what keeps a flaky-but-recovering job from paging on every blip.

The timezone is the field most often wrong: a schedule interpreted in the wrong zone produces missed-check-in alerts that drift by hours and look like infrastructure flakiness.

**Guidelines:**

- MUST set the timezone explicitly rather than relying on a default.
- MUST set the maximum runtime above the job's realistic worst case, not its typical case, or a slow run alerts as a stuck one.
- SHOULD set a failure threshold above one for any job with a known-flaky dependency, and a recovery threshold that matches how confident a resolution needs to be.
- MUST account for the per-monitor check-in rate limit when instrumenting a frequently-running job.

## The Hosting-Platform Shortcut

Sentry's build integration can create monitors automatically from a hosting platform's own scheduled-job configuration, which saves declaring them twice. It carries a documented limitation: it applies to one routing model only, and does nothing for applications built on the other.

That limitation is invisible at build time — the option is accepted, the build succeeds, and no monitors appear.

**Guidelines:**

- MUST confirm the automatic-monitor option applies to the application's routing model before relying on it; where it does not, it silently does nothing.
- MUST verify monitors actually exist in Sentry after enabling it, rather than treating the option as evidence.
- SHOULD declare monitors in code where the shortcut does not apply, so the schedule lives beside the job.
