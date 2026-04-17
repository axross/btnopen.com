# Change Management

Apply these rules on every task to keep changes focused, safe, and easy to review.

## Stay Within Scope

- MUST only make changes that are necessary to fulfil the stated task. A task boundary is the single user-facing goal described in the request.
- SHOULD flag opportunities as comment lines for improvement — technical debt, naming issues, missing tests — as a written note to the user rather than making unsolicited changes.

## Make Incremental Changes

- SHOULD decompose large tasks into a sequence of small, independently verifiable steps.
- MUST verify each step (see [code-quality.md](./code-quality.md)) before moving on to the next. Do not accumulate unverified changes across many files before checking.

## Follow Existing Patterns

- MUST read the code in the area you are modifying. Mimic its arcitecture/structure, naming conventions, and coding idioms.
- MUST search the codebase for how similar problems are already solved.
- MUST NOT silently change conventions that are already established project-wide. If there is a compelling reason to change a convention, surface it to the user first.

## Adding NPM Dependencies

- SHOULD NOT add a new npm dependency when the task can be reasonably accomplished with the existing packages in `package.json`, built-in Node.js or Web APIs.
- When you are adding a new npm dependency,
  - MUST explore couple of npm packages as options, and
  - MUST prefer platform-agnostic npm packages over platform-specific npm packages.
  - MUST prefer more popular, well-tested and maintained packages.

## Modifying the Database Schema

- MUST run `npm run migrate:create` immediately after changing any Payload CMS collection schema, then `npm run migrate:up` to apply the migration locally before testing.
- MUST NOT modify an already-applied migration file. Create a new migration instead.

## Modifying Payload CMS Configuration

- MUST NOT modify files under `app/(payload)/`. These files are managed by Payload CMS and will be overwritten on upgrades.
- Payload collection definitions, hooks, and access control rules live under `payload/`. Changes require a migration only when they alter the database schema (adding, removing, or renaming fields/collections, or changing field types). Hook, access control, or admin UI changes do not.
