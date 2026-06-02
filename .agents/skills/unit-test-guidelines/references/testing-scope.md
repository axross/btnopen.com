# Testing Scope

Unit tests are the right tool when a behavior can be exercised through an exported contract with local data and local fakes. They are the wrong tool when confidence depends on framework wiring, browser behavior, or how multiple pieces work together.

**Concrete Examples:**

> Good unit target: `formatLocation()` renders a location array as a stable string.

> Good unit target: `McpBlogPostResponse` decodes both paginated and single-document Payload responses.

> Better integration/e2e target: a blog post page renders Payload content, markdown output, live preview, and route metadata correctly.

> Better integration/e2e target: a React component depends on a third-party render-prop API, context provider, focus behavior, or user interaction timing.

**Guidelines:**

- MUST add or update Jest unit tests when a non-trivial pure helper, schema, parser, serializer, validator, or tool handler changes.
- SHOULD use unit tests for boundary-value logic, schema defaults, validation failures, mutation safety, and custom MCP tool handlers with mocked Payload requests.
- MUST NOT use unit tests as a substitute for Playwright coverage when the changed surface is user-facing UI.
- SHOULD prefer integration or e2e coverage when confidence depends on Next.js routing, Payload runtime behavior, browser APIs, rendering, providers, render props, or third-party UI behavior.
- SHOULD turn manual user instructions into automated checks when possible: identify the caller, perform the same public action, and assert the result the caller can observe.
- SHOULD keep unit tests fast, deterministic, and independent so they can run as a tight feedback loop.

## Render Props And Component Boundaries

Render-prop components are easy to test badly because the tempting path is to extract the render function or mock the render-prop library. That tests implementation wiring instead of user-visible behavior.

**Good Direction:**

```ts
// Prefer testing a component through the rendered behavior users depend on.
// In this project, route/component behavior usually belongs in Playwright e2e.
```

**Avoid:**

```ts
// Avoid exporting a private render prop only so a unit test can call it.
// Avoid mocking the third-party render-prop component just to inspect arguments.
```

**Guidelines:**

- MUST NOT extract and export private render-prop functions solely to make them unit-testable.
- MUST NOT mock a render-prop dependency solely to inspect private callback arguments.
- SHOULD test component behavior through rendered output and user-visible interaction when render props, providers, or browser behavior are involved.
- SHOULD consult [React Component Guidelines](../../react-component-guidelines/SKILL.md) and [E2E Testing Guidelines](../../e2e-testing-guidelines/SKILL.md) when the unit under discussion is a component rather than a pure helper.
