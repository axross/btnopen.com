# Dev Commands

Apply this reference when choosing which npm script to run or when updating the command surface in `package.json`. The project pins Node.js `>=24.0.0` and npm `>=10.0.0` in `package.json`; respect those pins when running or upgrading.

## Application Commands

These commands run the Next.js and Payload application locally or as a production build.

| Command | Purpose |
| ------- | ------- |
| `npm run dev` | Starts the development server at `http://localhost:3000` with Pino logs pretty-printed. |
| `npm run build` | Builds the production bundle. |
| `npm run start` | Starts the production server produced by `npm run build`. |

**Guidelines:**

- MUST use `npm run dev` for manual browser verification of UI, route, metadata, and CMS-driven output changes.
- MUST run `npm run build` when changes affect Next.js routes, metadata, Payload config, runtime config, dependencies, or TypeScript signatures.
- SHOULD use `npm run build` followed by `npm run start` when verifying production-only caching, image, or compiler behavior.

## Quality Commands

These commands enforce formatting, linting, unit behavior, and end-to-end behavior.

| Command | Purpose |
| ------- | ------- |
| `npm run format` | Formats the code and documentation with Biome. |
| `npm run lint` | Runs `biome check`, including formatting and lint rules. |
| `npm run test:unit` | Runs the Jest unit suite. |
| `npm run test:e2e` | Runs the Playwright end-to-end suite. |
| `npm run test:e2e -- --update-snapshots` | Regenerates Playwright snapshots for the local platform. |

**Guidelines:**

- MUST run `npm run format` and `npm run lint` after code or documentation edits.
- MUST run `npm run test:unit` when a change affects code the unit suite covers.
- MUST run `npm run test:e2e` when a change affects a UI output surface or e2e coverage.
- MUST NOT use snapshot updates to hide unexpected visual regressions; pair each snapshot update with a reason the visual change is intentional.
- SHOULD report skipped quality commands, including the reason and residual risk, before completion.

## Payload Migration Commands

Payload migration commands alter or inspect the database migration state. The target database is selected by environment variables.

| Command | Purpose |
| ------- | ------- |
| `npm run migrate:status` | Shows the current Payload migration status. |
| `npm run migrate:create` | Creates a new Payload migration entry after schema changes. |
| `npm run migrate:up` | Applies pending Payload migrations to the selected database. |

**Guidelines:**

- MUST run `npm run migrate:create` immediately after changing a Payload collection schema.
- MUST run `npm run migrate:up` locally before testing schema changes.
- MUST NOT edit an already-applied migration file; create a new migration instead.
- SHOULD run `npm run migrate:status` when investigating migration drift.
