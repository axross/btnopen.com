# Error Handling

Apply this reference when adding an error or not-found boundary, throwing a navigation interrupt, catching around framework calls, or reviewing how a change fails.

## The Boundary Files

| File                   | Catches                                                  | Notes                                                           |
| ---------------------- | -------------------------------------------------------- | --------------------------------------------------------------- |
| `error.tsx`            | Errors in the segment's page and its children            | Must be a Client Component                                      |
| `global-error.tsx`     | Errors in the root layout itself                         | Replaces the root layout; renders its own `<html>` and `<body>` |
| `not-found.tsx`        | A `notFound()` interrupt, and unmatched URLs at the root | —                                                               |
| `global-not-found.tsx` | A whole-document not-found page                          | **Experimental**: `experimental.globalNotFound`                 |
| `forbidden.tsx`        | A `forbidden()` interrupt                                | **Canary**: `experimental.authInterrupts`                       |
| `unauthorized.tsx`     | An `unauthorized()` interrupt                            | **Canary**: `experimental.authInterrupts`                       |

An `error.tsx` receives `error` and `reset`, and sits **inside** its segment's layout — which is why it cannot catch that layout's own errors. Those go to the parent boundary, and an error in the _root_ layout goes to `global-error.tsx`.

**Guidelines:**

- MUST place an error boundary in the parent segment when the throwing code is in a layout; a sibling `error.tsx` never sees it.
- MUST mark every `error.tsx` a Client Component; the framework requires it.
- SHOULD provide `global-error.tsx` in any application that renders anything in its root layout that can fail, since nothing else catches it.
- MUST render `<html>` and `<body>` inside `global-error.tsx`; it replaces the root layout rather than nesting inside it.
- SHOULD offer a recovery affordance — the `reset` callback, or a link home — rather than a dead-end message.
- MUST NOT render the raw error message or stack to the user in production; it is a server error's detail leaking to a client surface.

## Navigation Interrupts

These functions work by **throwing a special error** that the framework catches. That mechanism is the source of every surprise in this section.

| Function              | Effect                              | Stability  |
| --------------------- | ----------------------------------- | ---------- |
| `notFound()`          | Renders the nearest `not-found.tsx` | Stable     |
| `redirect(url)`       | 307 (or 303 from a server function) | Stable     |
| `permanentRedirect()` | 308                                 | Stable     |
| `forbidden()`         | Renders `forbidden.tsx`             | **Canary** |
| `unauthorized()`      | Renders `unauthorized.tsx`          | **Canary** |

**Guidelines:**

- MUST call `notFound()` when a looked-up record does not exist, rather than rendering an empty state that returns 200; a soft 404 is wrong for crawlers, monitoring, and caching alike.
- MUST call `redirect()` outside a `try` block, or rethrow control-flow errors from the `catch` — see below.
- SHOULD use `permanentRedirect` only for permanently moved URLs; browsers and intermediaries cache a 308 aggressively and it is hard to take back.
- MUST gate any use of `forbidden()` or `unauthorized()` behind `experimental.authInterrupts` and record that they ship on the canary channel.
- SHOULD return a 404 rather than a 403 when revealing that a record exists is itself a disclosure.

## `try`/`catch` Placement

A `catch` that wraps a framework navigation call swallows its control-flow error, and the navigation silently does not happen — no redirect, no not-found, no error. This is the most common self-inflicted bug in this area.

```ts
// Wrong — the catch eats the redirect
try {
  await save(input);
  redirect("/done");
} catch (error) {
  return { error: "Save failed" };
}

// Right — redirect after the try
try {
  await save(input);
} catch (error) {
  reportError(error);
  return { error: "Save failed" };
}
redirect("/done");

// Also right — rethrow control flow, so the redirect can stay inside the try
try {
  await save(input);
  redirect("/done");
} catch (error) {
  unstable_rethrow(error);
  return { error: "Save failed" };
}
```

**Guidelines:**

- MUST place `redirect()`, `notFound()`, and the other interrupts outside any `try` whose `catch` does not rethrow.
- MUST call `unstable_rethrow(error)` as the first statement of any `catch` that could see a framework control-flow error.
- SHOULD catch at the root call site — the route module, the server function, the handler — rather than around every await, so one place decides what the user sees.
- MUST NOT catch an error only to log it and continue as though it succeeded.

## Reporting

Which errors are reported, at what level, with what redaction, belongs to a software instrumentation capability. Two Next-specific rules follow from the mechanism above.

**Guidelines:**

- MUST NOT report a `notFound()` or `redirect()` interrupt to the error tracker; they are control flow, and reporting them buries real errors in noise.
- MUST report from `onRequestError` in `instrumentation.ts` for server-side errors, and from `global-error.tsx` for root-layout failures — see the observability wiring reference.
- SHOULD attach the route and request context available at the boundary, since the tracker cannot recover it afterwards.

**Review checks:**

- A `catch` around a `redirect()` or `notFound()` with no `unstable_rethrow` — **Major**; the navigation silently does not happen.
- A missing record rendered as an empty state with a 200 instead of `notFound()` — **Major**.
- A new `error.tsx` with no reporting hook wired to the project's error tracker — **Major**; failures become invisible.
- A raw error message or stack rendered to the user — **Major**.
- `error.tsx` added without `"use client"` — **Critical**; the build fails.
- A canary auth interrupt used with no config flag or no note that it is pre-stable — **Major**.
- `notFound()` or `redirect()` reported to the error tracker as an exception — **Minor**; it is noise that hides real failures.
