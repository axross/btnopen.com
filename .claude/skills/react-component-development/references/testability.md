# Testable Components

Apply this reference when adding the hooks a test uses to reach into a component, or when a component's shape makes it hard to assert against.

This reference owns the **component's** side: which elements carry a hook, how it is named, and how it propagates. The test's side is owned elsewhere — the locator fallback order, what to assert, and how to wait belong to the project's end-to-end testing practices; mock, fixture, and test-isolation design generally belongs to its unit-testing practices.

## Test Hooks on Meaningful Elements

A test that locates an element by its copy breaks on a wording change; one that locates it by position breaks on a reordering. A stable test hook survives both, so every element a test needs to reach carries one.

**Guidelines:**

- MUST put a test hook on every element a test needs to locate: a component's root, each interactive control, and each element whose content is asserted.
- SHOULD use kebab-case for hook values, and MUST match the host project's existing case convention where it has one.
- MUST NOT put a hook on an element no test reaches; add one when a test needs it rather than pre-instrumenting every node.
- MUST NOT encode a hook value from user data — derive it from a stable identifier such as a slug or an id.

When no element can carry a hook, the fallback order — and the requirement to add one rather than reach for a structural selector — is owned by the project's end-to-end testing practices.

## Naming: Scope-Relative by Default

**Scope-relative naming is the default.** A component names its internal elements for their role within itself — `title`, `author`, `tags` — and the parent supplies the scope. Tests then narrow from a container to its descendants, and the hook values mirror the component tree instead of restating a global path in every string.

```
page
  header              ← supplied by the page to <JobHeader>
    title             ← named inside <JobHeader>
    posted-at
  content
```

Some runners cannot scope: their locator matches a single flat identifier across the whole screen with no container narrowing — Maestro's `id:` matcher is the common example. Under those, hooks **must** be globally unique, which means prefixing each with its owning surface (`job-list-screen`, `job-list-error`, `job-list-item-<slug>`). This is a concession to the runner, not a better convention, and it is the one case where the project's end-to-end testing practices' preference for chained, container-scoped locators cannot be honoured.

**Guidelines:**

- MUST name hooks scope-relative to their component by default, letting the parent supply the surrounding scope.
- MUST make hooks globally unique, prefixed by their owning surface, when the host project's test runner matches identifiers flatly with no container scoping.
- MUST follow the host project's established convention when it already has one, rather than introducing a second naming scheme beside it.
- MUST let a component's own root hook be supplied by its caller (see [Propagating the Hook](#propagating-the-hook)), so the same component used twice on one screen can be told apart.

## One Hook per State Branch

A component that renders loading, error, empty, and loaded states through one hook value cannot be asserted against — a test can prove it mounted but not which state it reached. Distinct hooks per branch are what make each state independently provable.

**Guidelines:**

- MUST give each of a component's mutually exclusive states its own hook value, so loading, error, empty, and loaded are separately assertable.
- MUST give a control that only exists in one state its own hook, so a test can assert its absence in the others — a retry button that must not appear on a terminal failure is proven only by its absence.
- SHOULD keep the component's root hook stable across every branch, so a test can assert the component mounted independently of its state.

## Propagating the Hook

Because the props spread carries undeclared attributes to the root ([props.md](./props.md)), a caller-supplied hook reaches the element without the component declaring it. A component that needs to _read_ the value — to derive a variant of it — declares it explicitly and forwards it.

**Example:**

```tsx
export function JobList({
  isPending,
  "data-testid": dataTestId,
  ...props
}: ComponentProps<"ul"> & {
  isPending: boolean;
  "data-testid"?: string;
}): JSX.Element {
  if (isPending) {
    return (
      <JobListLoading
        data-testid={dataTestId ? `${dataTestId}-loading` : undefined}
        {...props}
      />
    );
  }

  return <JobListLoaded data-testid={dataTestId} {...props} />;
}
```

**Guidelines:**

- MUST let a caller-supplied hook reach the root element through the props spread rather than hard-coding the component's own value over it.
- MUST declare the hook prop explicitly when the component derives another value from it, and forward both.
- SHOULD suffix a loading fallback's hook with `-loading` derived from the loaded hook, so a test can target the skeleton and the loaded content by related names.
- MUST propagate the hook through every wrapper a component introduces, so adding a layout wrapper never silently detaches a test.

## Choosing the Mocking Seam

A component test is only worth writing if the component's real logic runs. Mocking the hook the component calls, or the client it fetches through, leaves nothing under test but the mock's return value threaded into markup.

Mock at the **data layer** — the function that performs the request or reads the database — and let the query, its mapping, its error classification, and the component's branching all run for real.

**Guidelines:**

- MUST mock at or below the data-access function a component's data path ultimately calls — that function itself, or the network layer beneath it — never the hook, the query, or the state selector between it and the component. This deliberately reaches past the nearest boundary the project's unit-testing practices would fake, because the mapping and error classification in between are the component's logic under test.
- MUST keep domain error types real, so the component's error-classification path is exercised rather than stubbed past.
- MUST give each test its own instance of the shared query client or cache the component reads through, so one test's cached result cannot satisfy another's assertion.
- SHOULD seed a store directly for a test that needs an authenticated or otherwise pre-conditioned state, rather than driving the UI through the steps that produce it.
- SHOULD keep components free of module-scope side effects, so importing one into a test does not start timers, open connections, or read storage.

## Accessibility Props as Locators

An element that carries an accessible role and name is locatable by them, which is useful exactly where a test hook cannot reach — a control rendered by a third-party component, or one portaled out of the component's own markup.

That every control **has** a role and an accessible name is owned by the project's high-fidelity UI design practices, and holds regardless of testing. This section covers only what follows for a test: those props are a locator of last resort, and they are not a place to smuggle test data.

**Guidelines:**

- SHOULD rely on the accessible role and name as the locator when an element cannot carry a test hook.
- MUST NOT add an accessibility attribute purely as a test hook when its value would not make sense to assistive technology; add a test hook instead.
