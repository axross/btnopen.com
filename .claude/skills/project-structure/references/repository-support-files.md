# Repository Support Files

Repository support files define runtime, build, type-checking, test, and observability behavior. Read the relevant file before changing the surface it configures.

| File or directory | Responsibility |
| ----------------- | -------------- |
| `package.json` | npm scripts, dependencies, Node/npm engine expectations |
| `tsconfig.json` | TypeScript compiler settings and path aliases |
| `next.config.ts` | Next.js config, image remote patterns, compiler/runtime integration |
| `payload.config.ts` | Payload CMS top-level configuration |
| `payload/` | Payload collections, globals, helpers, migrations, and seed helpers |
| `instrumentation.ts` / `instrumentation-client.ts` | Next.js instrumentation entry points |
| `sentry.server.config.ts` / `sentry.edge.config.ts` | Sentry runtime initialization |
| `playwright.config.ts` | Playwright e2e runner configuration |
| `biome.jsonc` | Biome formatting and linting rules |
| `skills-lock.json` | Lockfile for the agent skills installed from the shared library |
| `.env.example` | Documented environment-variable shape |
| `.pino-prettyrc` | Local pretty-printing for Pino logs |
| `e2e/.data/` | Local e2e fixture/runtime data |

## Enforced Complexity Budget

`biome.jsonc` enforces these thresholds, so a breach fails `npm run lint` rather than merely reading badly.

| Rule | Setting |
| --- | --- |
| `noExcessiveCognitiveComplexity` | `error` at 24 |
| `noExcessiveLinesPerFunction` | `info` at 120 — does not fail lint, but signals the function should be split |
| `noMagicNumbers` | warn — see the magic-value rule in [placement-and-naming.md](./placement-and-naming.md) |
| `noExplicitAny` | `suspicious` — `any` in changed code is a defect, not a style preference |

**Guidelines:**

- MUST NOT silently bypass an enforced complexity or length threshold; split the function instead of suppressing the rule.
- MUST NOT treat `cacheLife("hours")` / `cacheLife("days")` duration tokens as magic values — they are the project's approved vocabulary.

## Consulting Before Changing

Each of these files fails globally rather than locally: a small mistake in one breaks a gate, a runtime, or skill discovery outright rather than one rendered page. Read the owning source before editing.

**Guidelines:**

- MUST consult `README.md` before changing npm scripts, dependencies, formatting, linting, or verification commands — it is this project's contributor documentation and the source of truth for its commands.
- MUST consult the application security capability, plus the Payload rules in [payload-conventions.md](./payload-conventions.md), before changing environment-variable shape, secrets, Payload access control, or public exposure.
- MUST consult [observability-conventions.md](./observability-conventions.md) before changing instrumentation, Sentry config, or logger setup, and refresh the vendor documentation for whichever surface is changing.
- MUST consult [testing-conventions.md](./testing-conventions.md) before changing `playwright.config.ts` or files under `e2e/`.
- MUST treat generated outputs such as `.next/`, `node_modules/`, `payload/types.ts`, and Payload-generated route files as non-source unless the task explicitly concerns generation.
- MUST treat every skill under `.claude/skills/` except this repository's own project skills as generated: those copies come from the shared skill library, are reproduced by reinstalling, and discard any hand-edit. The agent skill management capability owns the install, lockfile, and refresh workflow; `README.md` records this repository's commands for it.
