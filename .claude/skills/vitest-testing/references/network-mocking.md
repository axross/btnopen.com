# Network Mocking

Apply this reference when code under test makes an HTTP, GraphQL, or WebSocket request.

Verified against Vitest 4.1.10 — <https://vitest.dev/guide/mocking/requests>

## Intercept, Do Not Stub

Vitest's documented recommendation is Mock Service Worker. The argument for it over stubbing `fetch` is that the code under test stays exactly as it ships: it makes a real request through the real client, and the interception happens below that. A stubbed `fetch` tests the stub's calling convention instead — and misses everything a real request does, from header handling to response parsing.

`setupServer` from `msw/node` covers Node environments; `setupWorker` covers a browser via the Service Worker API.

**Guidelines:**

- MUST intercept at the network layer rather than replacing `fetch` or the HTTP client, so the request path under test is the real one.
- SHOULD define handlers close to the data they describe, and reuse them between tests instead of redeclaring per file.

## The Lifecycle Contract

Three hooks, and each does something a suite breaks without:

```ts
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

`resetHandlers` in `afterEach` is what stops a per-test override from leaking into the next test — the same class of leak as an unrestored spy.

**Guidelines:**

- MUST call `resetHandlers` between tests; a handler overridden in one test otherwise applies to every test after it.
- MUST call `close` in `afterAll`, or the interceptor outlives the file.
- SHOULD register the lifecycle once in a setup file rather than repeating it per test file.

## Fail on the Unhandled Request

`onUnhandledRequest: "error"` throws when a request has no matching handler. Without it, an unmatched request either reaches the real network or fails in a way the test attributes to something else.

This is the setting that makes "no live external network" true rather than intended. A suite that has it off can pass in CI, pass locally, and quietly depend on a third-party service being up.

**Guidelines:**

- MUST set `onUnhandledRequest: "error"`; any other value permits a silent real request.
- MUST add a handler for a request the test does not care about rather than relaxing this setting to accommodate it.

## Where This Stops

An end-to-end suite deliberately exercises the real dependency, and mocking its network would defeat the point. The boundary is the level of the test, not the tool: this reference covers isolating a unit from the network; a capability owning end-to-end tests decides when the real service is the subject.

**Guidelines:**

- MUST NOT apply request interception to a test whose purpose is to exercise the real integration.
- SHOULD route a behavior that only reproduces against a live dependency to an end-to-end test rather than an elaborate handler.
