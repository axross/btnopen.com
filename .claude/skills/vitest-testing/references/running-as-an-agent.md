# Running Vitest as an Agent

Apply this reference before invoking Vitest at all — in a session, in a hook, or in CI. These rules cost nothing to follow and each prevents a specific, observed failure.

Verified against Vitest 4.1.10 — <https://vitest.dev/guide/learn/writing-tests-with-ai>

## The Watch-Mode Hang

`vitest` with no subcommand may start **watch mode**, which never exits. An agent that runs it waits on a process that has already finished its work and is sitting at a prompt, and the session is spent waiting on nothing.

The default is not simply "watch unless CI". In 4.1.10 it resolves from three conditions — `watch: !isCI && process.stdin.isTTY && !isAgent` — where `isAgent` is the same `std-env` AI-agent detection the reporter uses below. A recognized agent therefore gets run mode even in a TTY, which upstream added deliberately to close that gap.

That detection is a fingerprint, not a guarantee: `std-env` recognizes a fixed set of harnesses, so an unrecognized one in a TTY still falls through to watch mode. Passing `run` removes the dependency on being recognized at all, which is why Vitest's own documentation states it as the rule rather than as a fallback.

The project's own script is the usual source of the problem. A `"test"` script defined as `vitest` or `vitest --watch` hands the hang to anyone who runs `npm test`, and an explicit `--watch` overrides the detection above entirely.

**Guidelines:**

- MUST invoke `vitest run` (or pass `--no-watch`) for every non-interactive run; never invoke bare `vitest` and wait on it.
- MUST read the project's `test` script before running it, and invoke the runner directly when that script starts a watcher rather than assuming CI detection will save the run.
- MUST NOT background a watch-mode invocation to work around the hang; it holds a Vite server and a file watcher open for the rest of the session.
- SHOULD propose a `"test": "vitest run"` script and a separate `"test:watch"` when a project has only the watching form.

## Narrowing the Run

A full suite run is the most expensive way to answer most questions. Vitest accepts a path, a name pattern, and a line number, and each narrows both wall-clock time and output.

| Need                       | Invocation                                 |
| -------------------------- | ------------------------------------------ |
| One file                   | `vitest run path/to/file.test.ts`          |
| One test by name           | `vitest run -t "rejects an expired token"` |
| One test by location       | `vitest run path/to/file.test.ts:42`       |
| One project                | `vitest run --project unit`                |
| Only what changed          | `vitest run --changed`                     |
| Tests covering given files | `vitest run --related src/auth.ts`         |

Line targeting needs the full filename with extension; a partial path does not resolve.

**Guidelines:**

- MUST narrow to the file under change while iterating, and run the full suite once before declaring the change verified.
- SHOULD combine a name pattern with a path rather than using the pattern alone, since a bare pattern still loads every file to find matches.
- SHOULD use `vitest list` to answer "what would run" without running anything.

## Output Cost

The default reporter prints a line per passing test. On a large suite that is thousands of lines an agent pays for and does not read.

Vitest 4.1 ships a `minimal` reporter — aliased `agent` — that prints only failures and their errors, suppressing passing-test logs and the summary. It is selected automatically when Vitest detects it is running inside an AI coding agent, via the `std-env` library or an explicit `AI_AGENT` environment variable, and the same detection sets coverage's `skipFull`.

**The detection is skipped entirely when the project configures any custom `reporters` array.** A project that added `junit` for CI has silently opted out, and the default verbose output returns.

**Guidelines:**

- MUST pass `--reporter=minimal` explicitly when the project configures a custom `reporters` array, since automatic detection does not apply there.
- SHOULD leave a project with no `reporters` configuration alone and let detection do its work, rather than hardcoding a reporter into the config.
- SHOULD NOT raise verbosity to diagnose a failure before reading the failure the default output already printed.

## Reading a Failure

A Vitest failure carries the assertion diff, the stack frame, and any console output the test produced. That is normally enough. Re-running the suite to see the failure again costs a full run and adds nothing.

**Guidelines:**

- MUST read the reported diff and stack frame before re-running anything.
- MUST reproduce a failure, fix it, re-run the single file, and only then re-run the suite — not the reverse.
- MUST NOT update a snapshot to make a failure go away without reading what changed; the update flag is not a fix.
- SHOULD enable `printConsoleTrace` when a log line's origin is unclear, rather than adding temporary logging of your own.

## External Tooling

Vitest ships no first-party MCP server. Third-party ones exist — `@madrus/vitest-mcp-server` and `djankies/vitest-mcp` among them — wrapping the CLI to return structured results.

**Guidelines:**

- MUST NOT add a third-party MCP server to a project's toolchain without the human's explicit approval; it executes commands in their repository.
- SHOULD prefer the CLI, which is always present and needs no configuration, over a wrapper that adds a dependency for output shaping the `minimal` reporter already does.
