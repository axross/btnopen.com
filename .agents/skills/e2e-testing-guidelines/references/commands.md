# E2E Test Commands

Use this reference to choose the Playwright command that matches the target environment and snapshot task.

## Running E2E Tests

Run:

```bash
npm run test:e2e
```

**Guidelines:**

- MUST use `npm run test:e2e` for the default local end-to-end verification run.

## Updating Test Snapshots

Add `--update-snapshots` flag to the test command:

```bash
npm run test:e2e -- --update-snapshots
```

**Guidelines:**

- MUST update snapshots only when the visual output change is intentional.
- SHOULD pair snapshot updates with the reason the expected output changed.

## Test Against Local Production Build

Run:

```bash
npm run build && npm run start
```

And then run the tests in another terminal session:

```bash
npm run test:e2e
```

**Guidelines:**

- SHOULD use the local production build flow when verifying production-only behavior after `npm run build`.
- MUST keep the production server running while the e2e command executes in the second terminal session.

## Test Against Production on Vercel

Run:

```bash
PLAYWRIGHT_BASE_URL=https://btnopen.com npm run test:e2e
```

**Guidelines:**

- SHOULD use `PLAYWRIGHT_BASE_URL` only when intentionally testing the deployed production site instead of the local app.
