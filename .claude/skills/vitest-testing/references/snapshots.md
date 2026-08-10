# Snapshots

Apply this reference when choosing a snapshot form, updating one, or reviewing a snapshot change.

Verified against Vitest 4.1.10; custom snapshot matchers require 4.1.3+, custom domains and ARIA snapshots 4.1.4+ — <https://vitest.dev/guide/snapshot>

## Choosing a Form

| Matcher                 | Stores                          | Best for                                                  |
| ----------------------- | ------------------------------- | --------------------------------------------------------- |
| `toMatchInlineSnapshot` | in the test file                | small values — the diff is reviewable in the pull request |
| `toMatchSnapshot`       | a `.snap` file beside the test  | larger serialized output                                  |
| `toMatchFileSnapshot`   | a named file with any extension | HTML or markup, where syntax highlighting matters         |
| `toMatchAriaSnapshot`   | inline or a file                | accessibility-tree structure                              |

The inline form is the default worth reaching for. A snapshot a reviewer sees in the diff gets reviewed; one in a separate file usually does not.

`toThrowErrorMatchingSnapshot` and its inline variant capture thrown errors, rendered as `[Error: message]` rather than the bare message.

**Guidelines:**

- SHOULD prefer `toMatchInlineSnapshot` for values small enough to read in a diff.
- SHOULD use `toMatchFileSnapshot` for markup, so the stored form stays readable.

## Serializers and Format

`expect.addSnapshotSerializer` registers a serializer imperatively; `snapshotSerializers` in config does it for the whole project. `snapshotFormat` and `resolveSnapshotPath` control rendering and location.

Vitest's defaults differ from other runners' in ways a reviewer will notice: `printBasicPrototype` is `false`, the custom hint separator is `>` rather than `:`, serialization goes through `@vitest/pretty-format`, and the file header reads `Vitest Snapshot v1`.

Custom snapshot matchers (4.1.3+) and custom snapshot domains (4.1.4+) extend the pipeline for domain-specific comparison — a domain adapter owns `capture`, `render`, `parseExpected`, and `match`, which is what lets a stored snapshot contain a pattern a human hand-edited.

**Guidelines:**

- SHOULD register a serializer in config rather than per file when more than one file needs it.
- MUST NOT hand-edit a snapshot file unless a custom domain gives that edit meaning; the next update overwrites it.

## Updating

`-u` / `--update` rewrites snapshots, and accepts `new`, `all`, or `none` to bound what it touches. In watch mode, `u` updates the failing ones.

**Guidelines:**

- MUST read what changed before updating; the update flag records a new expectation rather than fixing anything.
- SHOULD use `--update=new` when adding tests to an existing suite, so an unrelated regression is not absorbed.

## The Two CI Behaviors

Vitest refuses to **write** snapshots when `process.env.CI` is truthy, so a missing snapshot fails rather than being created and passing. And an **obsolete** snapshot — one no test claims any more — fails CI too.

The second is the one people do not expect, and it is doing real work: it catches a deleted or renamed test whose stored output nobody cleaned up.

**Guidelines:**

- MUST commit a new snapshot with the test that produces it; CI cannot create it.
- MUST delete obsolete snapshots as part of the change that orphaned them, rather than leaving CI to report them.
- SHOULD consult the tool-agnostic unit-testing capability for whether a snapshot is the right assertion and how large one may reasonably get; this reference owns the four forms and their mechanics.
