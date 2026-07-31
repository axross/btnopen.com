# Abstraction Boundaries

Apply this reference to keep a change on the right side of the project's separation of concerns — while writing new code, and while reviewing where a change put it.

## Server / Client Boundary

Fetching from the client ships data-access code into the browser bundle and adds a network round-trip the server could have avoided. This whole section is conditional on the project drawing a server/client split — defer to the project's own component convention, if it defines one, and skip these rules where it does not.

**Guidelines:**

- MUST keep data fetching (a network request, opening a data-layer connection, calling a data-access function) out of a client-side component; lift it into the parent server-side component or its data-access module. A client component that fetches is the finding.
- MUST keep a client-side component from importing data-access modules, the data-layer SDK, or any server-only module — that leaks server code into the client bundle.
- MUST split a server-side component that needs client-only state, lifecycle, event handlers, or browser APIs into a server-side container and an interactive client child rather than converting the whole component.
- MUST NOT pass a server-only value type (e.g., an unresolved async/promise prop) into a client component where the framework forbids it.

## Domain Pipeline Boundary

A shared pipeline copied into a second place drifts out of sync, so a fix applied to one copy silently skips the rest.

**Guidelines:**

- MUST keep a shared domain pipeline (e.g., a content-transformation chain) behind its single owning module; a new component that re-creates the chain outside that module is the finding, per the project's own domain convention, if it defines one.
- MUST run domain processing on the side of any server/client boundary the pipeline belongs to (server-side only, where the project defines it so).
- MUST pair a new node/element type added to a renderer's component-mapping table with its component import, per the project's own domain convention, if it defines one.

## Cross-Tier Imports

An import that runs against the tier hierarchy couples layers meant to stay independent, eroding the boundaries the tiers exist to enforce.

**Guidelines:**

- MUST keep tier imports pointed the right way: a group-shared or global module MUST NOT import from a specific route's route-local code, so shared code never depends on route-local code. An import that crosses a tier in the wrong direction is the finding.
- SHOULD prefer the project's configured path aliases over deep relative imports (`../../../`) that cross more than two directory levels.
