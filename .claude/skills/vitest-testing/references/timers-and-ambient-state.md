# Timers and Ambient State

Apply this reference when a test involves time, a global the environment lacks, an environment variable, or the file system.

Verified against Vitest 4.1.10 — <https://vitest.dev/api/vi>

## Installing and Restoring a Clock

Vitest's fake timers use `@sinonjs/fake-timers`. `vi.useFakeTimers()` installs them; `vi.useRealTimers()` restores.

The pairing is not optional. A fake clock left installed leaks into every later file in the same worker, where it manifests as an unrelated test hanging on a timer that never fires — a failure with no visible connection to its cause.

```ts
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());
```

`useFakeTimers` accepts `toFake` (which globals to replace), `shouldAdvanceTime`, and `loopLimit`; the same options can be set suite-wide under `fakeTimers`.

**Guidelines:**

- MUST restore real timers in a hook paired with the one that installed them.
- SHOULD narrow `toFake` when only one timer API needs faking, so unrelated scheduling keeps working.

## Advancing

The advance and inspection calls — `advanceTimersByTime`, `advanceTimersToNextTimer`, `runAllTimers`, `runOnlyPendingTimers`, and the rest — are enumerated in the linked reference.

The part that is not in the list is how to choose between a call and its `Async` twin, and it is precise: **if a timer's callback awaits anything, the synchronous form returns before that work completes.** The test then asserts against a state that has not been reached yet, and the failure looks like a bug in the code rather than in the advance.

`setTimerTickMode` (`manual`, `nextTimerAsync`, `interval`) controls how time advances without explicit calls.

**Guidelines:**

- MUST use the `Async` variant when any scheduled callback is asynchronous.
- MUST NOT call `runAllTimers` on code that reschedules itself; it loops until `loopLimit` and then throws.
- SHOULD advance by a specific duration rather than running all timers, so the test states what interval it depends on.

## Freezing a Date

`vi.setSystemTime(date)` fixes what `Date.now()` and `new Date()` return; `getMockedSystemTime` and `getRealSystemTime` read back. This is what stops a snapshot containing a timestamp from failing a day later.

A frozen clock does not fix a timezone. `Intl` formatting and anything deriving a local date still follow the host's zone, so a test asserting formatted output needs `TZ` set for the run.

**Guidelines:**

- MUST freeze the clock rather than tolerating a timestamp in a snapshot.
- MUST set `TZ` for the process when a test asserts on locale- or zone-formatted output; a frozen instant does not pin the zone.

## The Interaction With Waiters

`vi.waitFor` advances fake timers on its own while polling. That is convenient and it is also the source of most fake-timer deadlocks: a waiter and a manual advance in the same test can consume the same timers, leaving neither in the state the test expects.

**Guidelines:**

- SHOULD choose either explicit advancement or a waiter within a single test, not both.

## Globals

`vi.stubGlobal(name, value)` puts a value on `globalThis` — the standard way to supply `IntersectionObserver`, `ResizeObserver`, or `matchMedia` under a DOM shim that lacks them. Class syntax inside `vi.fn()` gives an observer the constructor shape it needs.

**Stubs persist across tests unless `unstubGlobals` is configured.** So does `vi.stubEnv`, unless `unstubEnvs` is. Both defaults are the leaky direction.

`vi.stubEnv` reaches both `process.env` and `import.meta.env`, which is why it is preferable to assigning either directly.

**Guidelines:**

- MUST enable `unstubGlobals` and `unstubEnvs` in any project that stubs; the values otherwise outlive the test that set them.
- MUST use `vi.stubEnv` rather than assigning to `process.env` directly, so both environment surfaces agree.
- SHOULD treat an accumulating list of browser-API stubs as a sign the suite belongs in Browser Mode.

## The File System

Vitest ships no file-system mocking. The documented approach is `memfs`, wired through mock files for both specifiers:

```
__mocks__/fs.cjs           → re-exports memfs
__mocks__/fs/promises.cjs  → re-exports memfs.promises
```

with `vi.mock("node:fs")` and `vi.mock("node:fs/promises")` in the test. `vol.fromJSON()` builds a tree; `vol.reset()` clears it between tests.

Beyond speed, this is what makes permission errors and a full disk testable at all.

**Guidelines:**

- MUST mock both `node:fs` and `node:fs/promises` when code touches either; mocking one leaves the other hitting the real disk.
- MUST reset the volume between tests, or files created by one test are visible to the next.
- SHOULD prefer passing a path into the code under test over mocking the file system, where the design allows it.
