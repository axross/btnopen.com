# Directory Conventions

Directory conventions separate URL-bearing route segments from implementation details. Route groups organize files without changing the URL; underscore-prefixed directories hold files that should not become routes.

**Guidelines:**

- SHOULD use route groups (`(group-name)` directories) to organize routes logically without affecting the URL structure.
  - For example, `(app)/` wraps all main application routes, `(index)/` groups the index route's files.
- MUST prefix non-route directories with `_` to exclude them from routing.
  - Use `_/` for feature-agnostic shared modules such as components, helpers, and repositories scoped to a layout level.
  - Use `_components/` for UI components that are specific to the nearest layout or page.
