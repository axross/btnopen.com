# E2E Test Commands

## Running E2E Tests

Run:

```bash
npm run test:e2e
```

## Updating Test Snapshots

Add `--update-snapshots` flag to the test command:

```bash
npm run test:e2e -- --update-snapshots
```

## Test Against Local Production Build

Run:

```bash
npm run build && npm run start
```

And then run the tests in another terminal session:

```bash
npm run test:e2e
```

## Test Against Production on Vercel

Run:

```bash
PLAYWRIGHT_BASE_URL=https://btnopen.com npm run test:e2e
```
