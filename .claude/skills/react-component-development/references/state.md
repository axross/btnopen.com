# State Handling

Apply this reference when deciding where a piece of state lives — inside a component, in a shared provider, in a store, or outside the client entirely.

## Where State Goes

Work down this list and stop at the first row that fits. Each step outward costs reach: more components re-render, more tests need setup, and the state outlives the surface that owns it.

| The state is…                                        | Put it in                                |
| ---------------------------------------------------- | ---------------------------------------- |
| used by one component and its children               | `useState` in that component             |
| shared by a subtree, and changes rarely              | a context provider at the subtree's root |
| shared app-wide, and the project has a store library | a feature-owned store in that library    |
| shared app-wide, and the project has none            | a context provider at the app root       |
| a cached copy of something a server owns             | the project's server-state layer         |

**Guidelines:**

- MUST place state in the smallest component that can own it, and lift it only when a sibling genuinely needs it.
- MUST NOT introduce a state-management library into a project that has none; `useState` plus context is the default.
- MUST use the host project's existing store library when it has one, rather than adding a parallel mechanism beside it.
- MUST NOT keep a value in state that can be derived from existing props or state during render.

## Local State

Most state never needs to leave the component rendering its control. Keeping it there lets a reader see the value and the handler that changes it without scrolling, and lets a test drive the behavior by rendering one component rather than assembling a provider tree or seeding a store first.

**Guidelines:**

- MUST keep transient interaction state — a field's draft value, an expanded row, a menu's open flag — local to the component that renders the control.
- SHOULD colocate a state variable with the handler that updates it, so a reader sees both without scrolling.
- MUST NOT lift local state into a shared store to avoid passing one prop; a store entry is app-lifetime state, and a prop is not.

## Shared State Through Context

A context provider is the default sharing mechanism. Its value should be a stable object, so consumers do not re-render on every provider render.

**Guidelines:**

- MUST memoize a context value under manual memoization, so it changes only when its contents do — after checking the project's memoization regime, since an auto-memoizing compiler already covers this (see [memoization.md](./memoization.md)).
- MUST export a hook that reads the context and throws a named error when used outside its provider, rather than exporting the raw context and letting a consumer read `null`.
- SHOULD split a large context into separate providers when one part changes far more often than another, so a frequent update does not re-render consumers of a stable value.
- SHOULD keep a provider that owns a service or a resource — a database handle, a media session — separate from providers that own view state.

## A Store Library, When the Project Has One

Where the host project uses a store library, a store is **feature-owned and small**. A global store needs a stated reason; the default is a store per feature, holding that feature's cross-cutting state.

The store module exports the store plus **narrow selector hooks**, so a component subscribes to the one value it renders rather than to the whole store.

**Example:**

```ts
/** Selector hook for app-wide auth status. */
export function useAuthStatus(): AuthStatus {
  return useAuthStore((state) => state.status);
}
```

**Guidelines:**

- MUST keep stores feature-local by default, and state the reason when a store is genuinely app-global.
- MUST export named selector hooks for the values components read, rather than expecting each component to write its own selector inline.
- MUST NOT subscribe a component to the whole store when it renders one field.
- MUST read a store **non-reactively** — through its imperative accessor — from code that runs outside React's render cycle, such as a data-layer function or an event callback.
- SHOULD keep a store's actions on the store itself, so a consumer imports one thing rather than a store and a set of loose mutators.
- SHOULD document each action's effect on the store's terminal states, so a reader can tell which transitions are possible.

## Server State Belongs Elsewhere

A value the server owns is a **cache**, not component state. Holding it in `useState` re-implements staleness, refetching, deduplication, and invalidation by hand, and each component that does so implements them slightly differently.

Where that boundary runs — including what copying a server-owned result into local state costs, and what to do instead — is owned by a **server-state capability** under its server-state-boundary topic. What follows is only where a component meets it.

**Guidelines:**

- MUST route server-owned data through the host project's server-state layer rather than fetching it into `useState` inside a component.
- MAY hold a draft of a server value in local state while a form is being edited, sending it through a mutation on submit.
- MUST NOT organize that layer's factories, cache keys, invalidation, or error strategy here; this skill stops at the component boundary, and the host project's own server-state conventions — or a TanStack Query development capability where the project uses that library — govern beyond it.
