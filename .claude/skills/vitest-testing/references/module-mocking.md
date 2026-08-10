# Module Mocking

Apply this reference when replacing a module's exports, partially mocking one, or diagnosing a mock that does not take effect.

Verified against Vitest 4.1.10 — <https://vitest.dev/guide/mocking/modules>

## Hoisting

When Vitest sees `vi.mock` in a file it rewrites every static import into a dynamic one and **moves the `vi.mock` call to the top of the file**, above the imports. The mock is therefore registered before any imported module evaluates — which is the point, and also the trap.

Anything the factory closes over is not initialized yet. A variable declared with `const` above the `vi.mock` call is still in its temporal dead zone when the hoisted factory runs.

`vi.hoisted` is the escape hatch: it hoists a block alongside the mock, so a value both can see is defined in time.

```ts
const { fakeClock } = vi.hoisted(() => ({ fakeClock: vi.fn() }));
vi.mock(import("./clock.js"), () => ({ now: fakeClock }));
```

**Guidelines:**

- MUST wrap any value a `vi.mock` factory references in `vi.hoisted`; a plain module-level constant is undefined when the factory runs.
- SHOULD pass a dynamic `import()` rather than a string path to `vi.mock`, so the factory's shape is type-checked against the real module.

## Partial Mocks

A factory receives `importOriginal`, which is **asynchronous and must be awaited**. Spreading the original and overriding one export keeps the rest real.

Calling `vi.mock` with no factory automocks: arrays become empty, primitives are kept, methods and getters return `undefined`, objects are deep-cloned. Automocked getters no longer call through in v4.

`{ spy: true }` is the third mode — every export keeps its real behavior while becoming observable. It is also the only thing that works against a sealed ESM namespace in Browser Mode.

**Guidelines:**

- MUST await `importOriginal`; an unawaited call yields a promise where the module was expected.
- SHOULD use `{ spy: true }` when the test needs to observe calls rather than change behavior, instead of reimplementing the module in a factory.

## Mock Directories

A `__mocks__` directory adjacent to a module supplies its mock — but **it stays inert until a `vi.mock` call names that module**. Placing a file there and expecting it to apply automatically does nothing.

For a project-wide mock, call `vi.mock` in a setup file.

**Guidelines:**

- MUST call `vi.mock` for any module whose `__mocks__` file should apply; the directory alone has no effect.
- SHOULD register project-wide mocks in `setupFiles` rather than repeating `vi.mock` across every test file.

## Built-Ins and Modules That Do Not Exist

Node built-ins are mocked by their prefixed specifier — `vi.mock("node:fs")`. A module that does not exist on disk (an editor API, a native binding) needs to resolve first: either an entry in `test.alias`, or a plugin whose `resolveId` claims it. Then `vi.mock` applies normally.

**Guidelines:**

- MUST mock a built-in under the specifier the code imports, including the `node:` prefix when present.
- SHOULD alias a virtual module in config rather than committing a stub package to satisfy resolution.

## The Same-File Limit

**A call made from one function to another in the same module cannot be mocked from outside.** Mocking replaces what other modules see; a call resolved within the module still reaches the original.

```ts
export function foo() {
  return "foo";
}
export function foobar() {
  return `${foo()}bar`; // this foo() cannot be mocked
}
```

No option changes this. The fix is a refactor — move `foo` into its own module, or inject it as a parameter — and reaching for a workaround instead usually produces a test asserting nothing.

**Guidelines:**

- MUST refactor rather than work around this: extract the dependency into its own module, or pass it in.
- MUST NOT conclude a mock "did not work" without checking whether the call crosses a module boundary at all.

## Related Controls

`vi.doMock` registers without hoisting, which means the module must be re-imported dynamically afterwards. `vi.importActual` and `vi.importMock` load a module bypassing or applying the registry. `vi.unmock` / `vi.doUnmock` remove a registration. `vi.resetModules` clears the module cache so the next import re-evaluates.

A module that is externalized as a dependency is not transformed, so mocking it needs `server.deps.inline`.

**Guidelines:**

- MUST re-import a module dynamically after `vi.doMock`; the already-imported binding is unaffected.
- MUST add a dependency to `server.deps.inline` when `vi.mock` against it has no effect.
- SHOULD consult the tool-agnostic unit-testing capability for which dependency is worth mocking; this reference owns `vi.mock`'s mechanics once that choice is made.
