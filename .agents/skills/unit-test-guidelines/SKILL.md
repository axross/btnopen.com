---
name: unit-test-guidelines
description: Apply this skill when writing, refactoring, reviewing, or running Jest unit tests in this project. Covers Jest configuration, explicit `@jest/globals` imports, colocated `*.spec.ts` tests, `describe()`/`it()` naming and grouping conventions, behavior-focused test design, fixture quality, AHA test abstraction, mocks and fakes, async assertions, snapshot discipline, Zod/schema tests, type-only modules, and when unit tests should yield to integration or e2e coverage.
---

# Unit Test Guidelines

Use this skill for Jest-based unit tests. Unit tests are valuable when they exercise a small exported contract quickly, independently, and from a caller's point of view. They are harmful when they overfit implementation details or replace higher-confidence integration/e2e coverage.

## Testing Scope

See [testing-scope.md](./references/testing-scope.md) for:

- deciding whether a behavior belongs in unit, integration, or e2e coverage
- keeping pure helper tests small while routing browser, Payload, and framework behavior to broader tests
- recognizing when a unit test would be lower confidence than an integration or Playwright check

## Spec Structure and Naming

See [spec-structure-and-naming.md](./references/spec-structure-and-naming.md) for:

- adding, renaming, regrouping, or reviewing Jest `describe(...)` and `it(...)` blocks
- writing scenario names that read as clear verification sentences
- grouping repeated conditions or situations without duplicating function names

## Behavior and Implementation Details

See [behavior-and-implementation-details.md](./references/behavior-and-implementation-details.md) for:

- avoiding tests that overfit private helpers, provider internals, render-prop mechanics, or call shapes
- keeping assertions focused on exported behavior from a caller's point of view
- deciding when an implementation detail is actually part of the public contract

## Fixtures, Fakes, and AHA

See [fixtures-fakes-and-aha.md](./references/fixtures-fakes-and-aha.md) for:

- creating fixtures, setup helpers, Payload fakes, mocks, spies, or shared constants
- choosing duplication over premature abstraction when test cases need local clarity
- keeping reusable test helpers obvious, narrow, and behavior-oriented

## Assertions, Snapshots, and Side Effects

See [assertions-snapshots-and-side-effects.md](./references/assertions-snapshots-and-side-effects.md) for:

- choosing assertions for values, async errors, side effects, and mock calls
- deciding when snapshots are appropriate and how to keep them focused
- verifying observable outcomes without relying on incidental implementation details

## Schemas and Types

See [schemas-and-types.md](./references/schemas-and-types.md) for:

- testing Zod schemas, codecs, MCP response shapes, and collection/list response decoding
- handling type-only modules and compile-time contracts
- balancing runtime schema checks with TypeScript-level expectations

## Review Checklist

See [review-checklist.md](./references/review-checklist.md) for:

- implementation self-review or code review for Jest unit tests
- checking structure, naming, fixtures, mocks, assertions, and scope
- reporting residual risk when unit tests cannot cover the behavior with enough confidence

## Project Defaults

These defaults are intentionally short. Follow the linked references for examples, edge cases, and review criteria.

**Guidelines:**

- MUST keep Jest tests colocated as `*.spec.ts` unless an existing local pattern requires a different location.
- MUST import Jest APIs from `@jest/globals`; do not rely on global-scope Jest symbols.
- MUST use `it(...)` for scenarios and MUST NOT use `test(...)`.
- MUST run unit tests through `npm run test:unit` unless investigating a targeted failure.
- MUST run `npm run format`, `npm run lint`, and TypeScript checks after adding or changing unit tests.
- SHOULD prefer integration or e2e tests when confidence depends on Next.js, Payload runtime wiring, browser behavior, rendering, providers, render props, routing, or user-facing UI.
