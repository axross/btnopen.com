# Debugging and Failure Modes

Apply this reference when attaching a debugger, when a run will not exit, or when a run fails in a way the assertion output does not explain.

Verified against Vitest 4.1.10 — <https://vitest.dev/guide/debugging>

## Making a Breakpoint Work

Three flags together, each removing a different obstacle:

```bash
vitest run --inspect-brk --no-file-parallelism --test-timeout=0
```

- `--inspect-brk` starts the inspector and breaks before execution.
- `--no-file-parallelism` keeps everything in one process, so the debugger attaches to the process running the test.
- `--test-timeout=0` stops the test failing on a timeout while paused at a breakpoint.

Omitting the second attaches to a worker that may not run the file of interest; omitting the third makes every pause longer than five seconds a failure.

VS Code's JavaScript Debug Terminal needs no configuration. Chrome DevTools attaches through `chrome://inspect`. The default port is 9229, overridable as `--inspect-brk=127.0.0.1:PORT`. In watch mode, `--isolate false` keeps the session attached across reruns.

Browser Mode debugging adds `--browser` and wants a compound Node-plus-Chrome configuration to attach to both sides.

**Guidelines:**

- MUST pass all three flags together; each alone leaves a different obstacle in place.
- SHOULD add `--isolate false` when debugging in watch mode, so the debugger survives a rerun.

## A Run That Will Not Exit

The `hanging-process` reporter lists what is holding the process open. It is resource-intensive, so it is a diagnostic rather than a standing setting. `--detect-async-leaks` (4.1+) tracks leaked timers and handles through `node:async_hooks`.

The usual causes are an uncleared interval, an open server or connection, and a fake clock never restored.

**Guidelines:**

- MUST enable `hanging-process` only while diagnosing; it costs real time on every run.
- SHOULD check for an unrestored fake clock and an unclosed server before deeper investigation.

## The Documented Error Catalogue

| Error                                                    | Cause                                                    | Fix                                                                   |
| -------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| `Cannot find module './x'`                               | a path alias Vite does not resolve                       | correct the path, add `vite-tsconfig-paths`, or use an absolute alias |
| `Failed to Terminate Worker`                             | Node's `fetch` under `pool: "threads"`                   | switch to `forks` or `vmForks`                                        |
| `Segmentation fault`, `thread panicked`, `Abort trap: 6` | a native module that is not thread-safe, under `threads` | switch to `forks`                                                     |
| Custom export conditions ignored                         | Vitest resolves only `import` and `default`              | add the condition to `ssr.resolve.conditions`                         |
| `Unhandled Rejection`                                    | an async call without `await`                            | add the `await`, or assert with `.rejects`                            |

The middle two share one fix, and it is worth reaching for early: a mysterious crash under `threads` is almost always this.

**Guidelines:**

- MUST switch to `forks` before investigating a segfault or worker-termination failure further; it resolves the whole class.
- MUST NOT suppress `Unhandled Rejection` with `dangerouslyIgnoreUnhandledErrors`; it is reporting a real missing `await`.

## Tracing What the Runner Is Doing

`DEBUG=vitest:*` enables internal logging, and narrower scopes exist — `vitest:coverage` for coverage collection time. `printConsoleTrace` adds the origin of each console call, which identifies a stray log without adding more logging.

**Guidelines:**

- SHOULD enable `printConsoleTrace` to locate an unexplained log rather than inserting temporary logging.
- SHOULD use the narrowest `DEBUG` scope that covers the question; the full namespace is unreadable on a large suite.
