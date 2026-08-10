# Dependency Advisories

This is the ledger `npm audit` findings are read against. It exists because a
deferral nobody can find is indistinguishable from an oversight: a finding left
open needs a reachability judgement written where the next reader will meet it,
and that reader is whoever runs `npm audit` and wants to know whether the count
they see is the count that was already reasoned about.

It records the state, not the history. When the count moves, replace the rows
below rather than appending to them.

Last reconciled **2026-08-10**, in
[#225](https://github.com/axross/btnopen.com/issues/225).

## Current State

| Severity | Count |
| --- | --- |
| critical | 0 |
| high | 0 |
| moderate | 10 |
| low | 1 |

`npm audit --audit-level=high` reports nothing. Before #225 the same command
reported 25 findings, out of 45 in total.

## Standing Position

**Every `high` and `critical` finding is fixed rather than deferred.** That is
the position this repository holds, and it is what
[`docs/conventions/security.md`](../conventions/security.md) points here for. A
future finding at either severity is either cleared or gets a row in
[Open Findings](#open-findings) naming the path it is reached by and why it does
not apply — never left implicit.

**`moderate` and `low` findings are not chased.** They are listed below so the
count is legible, not because each is scheduled. One clears when a bump takes
it incidentally.

**Nothing in CI runs `npm audit`.** This was decided deliberately in #225, and
it is the part most likely to look like an oversight later, so it is written
down: the advisory count is watched by tooling outside this repository's
workflows, and a gate that fails on a freshly published upstream advisory turns
an unrelated pull request red — which is how audit gates get switched off.
Dependabot security updates, which are a repository setting rather than a file
one, remain the mechanism that proposes the fix.

## Open Findings

None at `high` or `critical`.

The `moderate` and `low` findings below are recorded for legibility. The
reachability column is why none of them is urgent, not a claim that any is
harmless.

| Package | Reached by | Judgement |
| --- | --- | --- |
| `dompurify`, `monaco-editor` | `@payloadcms/ui` → `@monaco-editor/react` → `monaco-editor` → `dompurify` | The Monaco editor renders inside the Payload admin, behind authentication, and is operated only by the site's own author. No reader-facing route loads it |
| `drizzle-kit`, `@esbuild-kit/*`, `esbuild` | `@payloadcms/db-sqlite` → `drizzle-kit` → `@esbuild-kit/esm-loader` → `esbuild` | Migration tooling. `drizzle-kit` runs from `npm run migrate:*`, never from a served request, and the `esbuild` advisory is about its development server, which nothing here starts |
| `@hono/node-server`, `@modelcontextprotocol/sdk`, `mcp-handler`, `@payloadcms/plugin-mcp` | `@payloadcms/plugin-mcp` → `mcp-handler` → `@modelcontextprotocol/sdk` → `@hono/node-server` | The `serve-static` path traversal is Windows-only, via an encoded backslash; this site builds and runs on Linux. `npm audit` proposes `@payloadcms/plugin-mcp@3.76.1` as the fix, which is a **downgrade** away from the version the rest of the Payload packages pin |

## The `tar` Critical, as a Worked Example

Kept because it is the shape of judgement the table above is asking for, and
because it was the finding that prompted #225.

Six `tar` advisories arrived at once, at `critical`, reached this way:

```
metascraper-description → @metascraper/helpers → re2 → node-gyp → tar
```

`re2` genuinely reaches the server graph — `docs/conventions/security.md`
records that it is pulled in through `metascraper-title` and
`app/(app)/_/repositories/get-webembed-metadata.ts`, which is why it sits in
`next.config.ts` `serverExternalPackages`. `node-gyp` does not. It is `re2`'s
**install** script, compiling the native binding when no prebuilt artifact is
available, and the archives `tar` unpacks there are the Node headers `node-gyp`
downloads from `nodejs.org`. Nothing a request can influence reaches that
parser.

That judgement decided urgency, not action: the fix was in range, so it landed
with the rest of the refresh.

## Reconciling the Ledger

Run `npm audit`. If the counts match [Current State](#current-state), nothing
has moved. If they do not:

1. Apply what is fixable — `npm audit fix` for anything in range.
2. For a `high` or `critical` finding that is left, decide whether it is
   reachable from a served request, and record the path and the judgement in
   [Open Findings](#open-findings). A finding with no row is not deferred; it is
   unfinished.
3. Update the counts above and the reconciled date.

Two mechanics are worth knowing before concluding that a finding cannot be
fixed:

- **`npm audit fix` stops short of a cross-pinned family.** The `@payloadcms/*`
  packages peer-depend on each other at an exact version, so moving one means
  moving all of them at once, which npm's incremental resolver will not do — it
  fails with `ERESOLVE` and leaves the findings in place. Deleting
  `package-lock.json` and running `npm install` resolves the family together.
  That takes every other in-range update with it, so read the resulting diff
  rather than assuming it is limited to the advisory set.
- **A `fixAvailable` that names a lower version is a downgrade.** npm reports it
  the same way it reports an upgrade.
