# Change Management

Apply these rules on every task to keep changes focused, safe, and easy to review.

## Stay Within Scope

Unrequested changes enlarge the review surface and the blast radius of a task, making regressions harder to attribute and to revert.

**Guidelines:**

- MUST only make changes that are necessary to fulfil the stated task. A task boundary is the single user-facing goal described in the request.
- SHOULD flag opportunities for improvement — technical debt, naming issues, missing tests — as a written note to the user rather than making unsolicited changes.

## Make Incremental Changes

Small, independently checkable steps localize a failure to the step that introduced it, instead of hiding it in a large unverified batch.

**Guidelines:**

- SHOULD decompose large tasks into a sequence of small, independently verifiable steps.
- MUST verify each step (see [code-quality.md](./code-quality.md)) before moving on to the next. Do not accumulate unverified changes across many files before checking.

## Follow Existing Patterns

Matching the surrounding code keeps the codebase legible as one authored voice and spares reviewers from re-learning a new style with every change.

**Guidelines:**

- MUST read the code in the area you are modifying. Mimic its architecture/structure, naming conventions, and coding idioms.
- MUST search the codebase for how similar problems are already solved.
- MUST NOT silently change conventions that are already established project-wide. If there is a compelling reason to change a convention, surface it to the user first.

## Adding Dependencies

Each dependency is a standing cost — maintenance, supply-chain surface, and bundle weight — carried for the life of the project, so the bar to add one is high.

- When you are adding a new npm dependency,
  - MUST explore a couple of npm packages as options, and
  - MUST prefer platform-agnostic packages over platform-specific ones.
  - MUST prefer more popular, well-tested and maintained packages.

**Guidelines:**

- SHOULD NOT add a new npm dependency when the task can be reasonably accomplished with the existing packages in `package.json`, or with built-in Node.js or Web APIs.
- MUST add dependencies through npm (`npm install <package>`) rather than editing `package.json` by hand, so the lockfile stays consistent.

## Modifying the Data Layer / Generated Code

A schema change without its migration leaves every other environment on the old schema, so what works locally breaks on the next deploy or fresh checkout.

- Payload collection definitions, hooks, and access control rules live under `payload/`. Changes there require a migration only when they alter the database schema — adding, removing, or renaming fields/collections, or changing field types. Hook, access control, or admin UI changes do not.
- Files under `app/(payload)/` are generated and managed by Payload CMS and are overwritten on upgrades. Do NOT hand-edit them; change the source-of-truth definitions under `payload/` instead.

**Guidelines:**

- MUST run `npm run migrate:create` immediately after changing any Payload CMS collection schema, then `npm run migrate:up` to apply the migration locally before testing (see [dev-commands.md](./dev-commands.md)).
- MUST NOT modify an already-applied migration file. Create a new migration instead.
- SHOULD rely on the production deploy to apply a merged migration to production automatically, before the new code serves traffic, rather than migrating production by hand; sequence a destructive schema change as expand/contract per [production-deployments.md](./production-deployments.md).
- MUST NOT modify files under `app/(payload)/`; they will be overwritten on upgrades.
