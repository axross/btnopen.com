---
trigger: always_on
---

# E2E Test Instructions

Rules for writing and maintaining end-to-end tests for this project using Playwright.

## Project Structure

- Test files live in `e2e/`
- Test files are named `.test.ts` (not `.spec.ts`)
- Test files mirror the Next.js `app/` route structure:
  - `e2e/routes/index/page.test.ts` → `/`
  - `e2e/routes/posts/slug/page.test.ts` → `/posts/[slug]`
- Shared helper utilities live in `e2e/helpers/`
- Snapshot files are auto-placed by the config
- The global setup test (`e2e/setup.test.ts`) handles authentication and saves an authenticated storage state to `.data/authenticated-storage-state.json`

## General Restrictions

- Do not use `maxDiffPixelRatio` options for snapshot testing (i.e. `toMatchSnapshot()`) for accurate test results

## Running E2E Tests

You need to run the application server prior to run the E2E tests. If you haven't, run `npm run dev`.

To run the E2E tests, run:

```
npm run test:e2e
```

When you expect the test snapshots to be updated, you can run the command with `--update-snapshots`:

```
npm run test:e2e -- --update-snapshots
```
