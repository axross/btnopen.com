# E2E Test Structure

## Project Structure

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

## Test File Structure

- MUST use kebab-case for file names.
- MUST use `.test.ts` extension for test files.

## Test Case Structure

- MUST use `test()` for each test case.
- MUST name test cases concisely.
- MUST wrap each action in `test.step()` in human-understandable granularity.
- MUST name test steps concisely.
