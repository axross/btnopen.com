---
status: accepted
---

# Stub server-only in the unit runner

The unit suite's subjects are largely server-realm modules, and several of them
import `server-only`. That package's exports map answers the `react-server`
condition with an empty module and every other condition with one that throws on
import, so the runner has to answer for it somehow. When the suite moved from
Jest to Vitest it did so by declaring `react-server` in the runner's global
resolve conditions, which resolves the package through its own mechanism rather
than standing something in for it. That choice was never recorded here; its
reasoning lived in a comment in `vitest.config.ts`.

Adding a spec for the markdown pipeline's entry point broke the arrangement. The
subject reaches `server-only`, and the spec serializes the pipeline's output with
`react-dom/server` to assert the HTML it produces — and `react-dom` answers that
same `react-server` condition with a module that throws on import, on every one
of its `server*` and `static*` subpaths. A subject needing both therefore
resolves under no single global condition set. The condition applies to the whole
process, so escaping it from inside one spec is not possible either: Node's own
`createRequire` resolves to the throwing build as readily as Vite does, and Vite
offers no per-package or per-file condition override.

Three arrangements were measured against the whole suite:

| Runner configuration | Result |
| --- | --- |
| `react-server` condition declared globally | 37 files / 376 tests; the markdown spec fails on `react-dom/server` |
| Condition removed, nothing in its place | 35 files / 320 tests; three specs fail on `server-only` |
| `server-only` aliased to its own empty stub, no condition | 38 files / 387 tests, green |

The third is what this repository now does, and it is what `next/jest` did before
the Vitest migration replaced it. The decision is therefore less a new direction
than a return to the arrangement the migration moved away from, taken now with
the measurement that the move away from it was missing.

The trade is worth naming rather than burying, because it is a fake standing
where a real mechanism used to be. Under the unit runner `server-only` now
enforces nothing: a client-realm module that imported it would load quietly in a
spec instead of failing. That is accepted because the unit runner was never where
that boundary is enforced — the build is, and it still fails there. What the
runner needs from `server-only` is only that it not throw.

Two alternatives were rejected. Splitting the suite into two Vitest projects, one
per realm, reaches the same green result with more machinery: two include lists
to keep in sync, and a new spec's realm becomes a placement decision its author
has to get right. Rewriting the markdown spec to avoid `react-dom/server` would
have meant asserting against the React element tree or hand-rolling a serializer,
which forfeits the thing that spec exists to check — that the pipeline produces
the HTML the site actually serves.
