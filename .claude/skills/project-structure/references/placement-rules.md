# Placement Rules

Placement follows ownership. Shared app primitives belong in the app-wide underscore directory, route-specific UI stays under the owning route, Payload configuration stays outside `app/`, and test files should live in the test surface that exercises the behavior.

For detailed route file conventions, consult the project's routing guidelines. For React component conventions, consult the project's React component guidelines. For maintainability review of file placement and abstraction boundaries, consult the project's maintainable-code guidelines.

**Guidelines:**

- MUST consult the project's routing guidelines before creating, moving, or renaming App Router routes.
- MUST consult the project's React component guidelines before adding or moving React components.
- MUST consult the project's maintainable-code guidelines when reviewing whether a module belongs in a route-local, route-group-shared, or feature-agnostic directory.
- MUST place CMS schema, hook, access-control, and admin customization code under `payload/`, not under `app/(app)/_`.
- MUST place app code that reads from Payload through shared repositories under `app/(app)/_/repositories/` unless it is tightly route-local.
- MUST place public static assets under `public/`; route-generated metadata images belong under the route segment that owns them.
- MUST keep generated, dependency, build, cache, and local-data directories out of source-placement decisions unless the task explicitly concerns those directories.
- SHOULD keep this skill descriptive rather than exhaustive; do not list every file when an ownership rule is clearer.
