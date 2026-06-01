# E2E Test Structure

## Project Structure

Project Structure shows where Playwright tests, helpers, setup files, and route-specific suites live in this repository.

```
<root>
├── e2e/
│   ├── .data/                         # local temporary data
│   ├── helpers/                       # test helpers
│   └── tests/
│       ├── setup.test.ts              # setup test
│       ├── metadata.test.ts           # website-global metadata test
│       ├── routes                     # route-specific tests
│       │   ├── index/
│       │   │   ├── page.test.ts       # visual/functional tests for the route
│       │   │   └── thumbnail.test.ts  # thumbnail image endpoint tests
│       │   └── posts/
│       │       ├── ...
│       │       └── slug/
│       │           └── ...
│       └── ...
└── ...
```

**Guidelines:**

- MUST place route-specific e2e tests under `e2e/tests/routes/`.
- MUST keep reusable e2e helpers under `e2e/helpers/`.
- SHOULD keep setup and global metadata tests directly under `e2e/tests/` when they are not route-specific.

## Test File Structure

Test File Structure sets the required project default: use kebab-case for file names.

**Guidelines:**

- MUST use kebab-case for file names.
- MUST use `.test.ts` extension for test files.

## Test Case Structure

Test Case Structure sets the required project default: use `test()` for each test case.

**Guidelines:**

- MUST use `test()` for each test case.
- MUST name test cases concisely.
- MUST wrap each action in `test.step()` in human-understandable granularity.
- MUST name test steps concisely.
